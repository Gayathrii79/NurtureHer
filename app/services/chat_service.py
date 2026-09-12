from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.health import ChatRepository
from app.schemas.health import ChatRequest
from app.services.gemini_service import GeminiService
from app.services.memory_service import ConversationMemoryService
from app.services.rag_service import RAGService
from app.services.translation_service import TranslationService
from app.rag.prompt_templates import build_health_coach_prompt


class ChatbotService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.gemini = GeminiService()
        self.rag = RAGService(db)
        self.memory = ConversationMemoryService()
        self.translator = TranslationService()

    async def message(self, user: User, payload: ChatRequest):
        language, _ = self.translator.resolve_language(payload.message, payload.language)
        retrieved_context, user_context = await self.rag.build_context(user, payload.message, language)
        history = await self.memory.get_recent_messages(user.id)
        prompt = self._build_prompt(payload.message, language, retrieved_context, user_context, history)
        response = await self.gemini.generate_response(prompt, language)

        # If language defaulted to English but Gemini recognized romanized input and responded
        # in a regional script, record the actual response language for TTS and history.
        actual_response_lang = self.translator.detect_language(response)
        if actual_response_lang and actual_response_lang != language and language == "en":
            language = actual_response_lang

        chat = await ChatRepository(self.db).create(user_id=user.id, message=payload.message, response=response, language=language)
        await self.db.commit()
        await self.memory.append(user.id, payload.message, response)
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
