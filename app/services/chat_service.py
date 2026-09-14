import re
from uuid import UUID

from fastapi import status
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.chat import ChatConversation
from app.models.user import User
from app.rag.prompt_templates import build_health_coach_prompt
from app.repositories.health import ChatConversationRepository, ChatRepository
from app.schemas.health import ChatRequest
from app.services.gemini_service import GeminiService
from app.services.memory_service import ConversationMemoryService
from app.services.rag_service import RAGService
from app.services.translation_service import TranslationService


def generate_conversation_title(message: str) -> str:
    cleaned = message.strip()
    if not cleaned:
        return "New Conversation"

    filler_patterns = [
        r"^(?:hello|hi|hey|good\s+(?:morning|afternoon|evening))\s*[,.!?-]*\s*",
        r"^(?:please\s+)?(?:can|could)\s+you\s+(?:please\s+)?(?:help|tell|guide|assist|explain)\s+(?:me\s+)?(?:with|about)?\s*(?:the\s+|a\s+|an\s+)?",
        r"^(?:i\'m\s+having|i\s+am\s+having|i\s+have|i\s+feel|i\'m\s+feeling|i\s+am\s+feeling|i\s+want\s+to\s+know\s+about)\s*(?:the\s+|a\s+|an\s+)?",
        r"^(?:what\s+is|what\s+are|how\s+to|how\s+can\s+i|why\s+am\s+i|why\s+do\s+i\s+have)\s*(?:the\s+|a\s+|an\s+)?",
        r"^(?:tell\s+me\s+about|help\s+me\s+with|explain)\s*(?:the\s+|a\s+|an\s+)?",
    ]

    text = cleaned
    for pattern in filler_patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE).strip()

    if not text or len(text) < 2:
        text = cleaned

    if len(text) > 45:
        cutoff = text[:45].rfind(" ")
        if cutoff > 15:
            text = text[:cutoff]
        else:
            text = text[:45]

    text = text.rstrip(" .,!?:;")
    if text:
        text = text[0].upper() + text[1:]

    return text or "New Conversation"


class ChatbotService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.gemini = GeminiService()
        self.rag = RAGService(db)
        self.memory = ConversationMemoryService()
        self.translator = TranslationService()

    async def create_conversation(self, user: User, title: str | None = None) -> ChatConversation:
        conv = await ChatConversationRepository(self.db).create(
            user_id=user.id,
            title=title or "New Conversation",
        )
        await self.db.commit()
        return conv

    async def list_conversations(self, user: User, limit: int = 50, offset: int = 0) -> list[ChatConversation]:
        return await ChatConversationRepository(self.db).for_user(user.id, limit, offset)

    async def get_conversation(self, user: User, conversation_id: UUID) -> ChatConversation:
        conv = await ChatConversationRepository(self.db).get_for_user(conversation_id, user.id)
        if not conv:
            raise AppError("Conversation not found", status.HTTP_404_NOT_FOUND)
        return conv

    async def delete_conversation(self, user: User, conversation_id: UUID) -> None:
        conv = await self.get_conversation(user, conversation_id)
        await ChatConversationRepository(self.db).delete(conv)
        await self.db.commit()

    async def get_conversation_messages(
        self,
        user: User,
        conversation_id: UUID,
        limit: int = 100,
        offset: int = 0,
    ):
        await self.get_conversation(user, conversation_id)
        return await ChatRepository(self.db).for_conversation(conversation_id, user.id, limit, offset)

    async def message(self, user: User, payload: ChatRequest):
        conv: ChatConversation | None = None
        if payload.conversation_id:
            conv = await self.get_conversation(user, payload.conversation_id)
            if conv.title == "New Conversation":
                conv.title = generate_conversation_title(payload.message)
        else:
            title = generate_conversation_title(payload.message)
            conv = await ChatConversationRepository(self.db).create(
                user_id=user.id,
                title=title,
            )

        conversation_id = conv.id

        language, _ = self.translator.resolve_language(payload.message, payload.language)
        retrieved_context, user_context = await self.rag.build_context(user, payload.message, language)
        history = await self.memory.get_recent_messages(user.id, conversation_id=conversation_id)
        prompt = self._build_prompt(payload.message, language, retrieved_context, user_context, history)
        response = await self.gemini.generate_response(prompt, language)

        # If language defaulted to English but Gemini recognized romanized input and responded
        # in a regional script, record the actual response language for TTS and history.
        actual_response_lang = self.translator.detect_language(response)
        if actual_response_lang and actual_response_lang != language and language == "en":
            language = actual_response_lang

        chat = await ChatRepository(self.db).create(
            user_id=user.id,
            conversation_id=conversation_id,
            message=payload.message,
            response=response,
            language=language,
        )
        conv.updated_at = func.now()
        await self.db.commit()
        await self.memory.append(user.id, payload.message, response, conversation_id=conversation_id)
        return chat

    async def history(self, user: User, limit: int = 50, offset: int = 0):
        return await ChatRepository(self.db).for_user(user.id, limit, offset)

    def _build_prompt(
        self,
        message: str,
        language: str,
        retrieved_context: str,
        user_context: str,
        history: list[dict[str, str]],
    ) -> str:
        history_text = "\n".join(f"User: {item['message']}\nAssistant: {item['response']}" for item in history)
        return build_health_coach_prompt(
            message=message,
            language=language,
            retrieved_context=retrieved_context,
            user_context=user_context,
            history_text=history_text,
        )
