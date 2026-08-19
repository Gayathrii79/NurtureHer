import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self) -> None:
        self.api_key = settings.gemini_api_key
        self.model = settings.gemini_model

    async def generate_response(self, prompt: str, language: str) -> str:
        if not self.api_key:
            return self._fallback_response(prompt, language)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 512},
        }
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(url, params={"key": self.api_key}, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except (httpx.HTTPError, KeyError, IndexError) as exc:
            logger.exception("Gemini request failed; using fallback response: %s", exc)
            return self._fallback_response(prompt, language)

    def _fallback_response(self, prompt: str, language: str) -> str:
        return (
            f"[{language}] I can offer general wellness education and help you prepare questions for a clinician. "
            f"Based on your message, keep tracking symptoms and seek urgent medical care for severe pain, bleeding, "
            f"self-harm thoughts, fainting, or breathing difficulty."
        )

