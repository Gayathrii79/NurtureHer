from __future__ import annotations

from typing import Any

from app.models.user import User
from app.rag.prompt_templates import build_health_coach_prompt
from app.repositories.health import ChatRepository
from app.schemas.health import ChatRequest
from app.services.gemini_service import GeminiService
from app.services.memory_service import ConversationMemoryService
from app.services.rag_service import RAGService
from app.services.translation_service import TranslationService


class ChatbotService:
    def __init__(self, db: Any) -> None:
        self.db = db
        self.gemini = GeminiService()
        self.rag = RAGService(db)
        self.memory = ConversationMemoryService()
        self.translator = TranslationService()

    async def message(self, user: User, payload: ChatRequest):
        detected_language = self.translator.detect_language(payload.message)
        language = self.translator.normalize_language(detected_language or payload.language, user.preferred_language)
        retrieved_context, user_context, sources = await self.rag.build_context(user, payload.message, language)
        history = await self.memory.get_recent_messages(user.id)
        prompt = self._build_prompt(payload.message, language, retrieved_context, user_context, history)
        response = await self.gemini.generate_response(prompt, language)
        chat = await ChatRepository(self.db).create(
            user_id=user.id,
            message=payload.message,
            response=response,
            language=language,
            retrieved_sources=sources,
        )
        await self.db.commit()
        await self.memory.append(user.id, payload.message, response)
        return chat

    async def rag_query(self, user: User, query: str, language: str = "en") -> dict[str, Any]:
        detected_language = self.translator.detect_language(query)
        lang = self.translator.normalize_language(detected_language or language, user.preferred_language)
        retrieved_context, user_context, sources = await self.rag.build_context(user, query, lang)
        prompt = self._build_prompt(query, lang, retrieved_context, user_context, [])
        response = await self.gemini.generate_response(prompt, lang)

        return {
            "query": query,
            "answer": response,
            "retrieved_sources": sources,
            "personalized_context": [line.strip() for line in user_context.split("\n") if line.strip()],
            "language": lang,
            "disclaimer": "This information is educational guidance based on verified clinical guidelines and does not replace medical diagnosis. Consult an ASHA worker or doctor for medical treatment.",
        }

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