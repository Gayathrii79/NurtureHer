import base64
import logging

from app.services.translation_service import TranslationService

logger = logging.getLogger(__name__)
import os
import io
import httpx


class SpeechToTextService:
    async def transcribe(self, content: bytes, language: str) -> str:
        """Transcribe audio content using Groq Whisper API via HTTPX."""
        normalized_language = TranslationService().normalize_language(language)
        logger.info("Received voice input for STT: bytes=%s language=%s", len(content), normalized_language)

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY is missing; cannot perform speech transcription.")
            raise RuntimeError("GROQ_API_KEY not set in environment")

        endpoint = "https://api.groq.com/openai/v1/audio/transcriptions"
        files = {
            "file": (f"voice.{normalized_language}.webm", content, "audio/webm"),
        }
        data = {
            "model": "whisper-large-v3-turbo",
            "language": normalized_language,
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(endpoint, data=data, files=files, headers=headers, timeout=30.0)
                response.raise_for_status()
                result = response.json()
                # Expected JSON: { "text": "transcript" }
                return result.get("text", "").strip()
            except httpx.HTTPError as e:
                logger.error("Groq Whisper transcription HTTP error: %s", e)
                raise RuntimeError("Speech transcription failed")


class TextToSpeechService:
    async def synthesize(self, text: str, language: str) -> str:
        normalized_language = TranslationService().normalize_language(language)
        logger.info("Generating local TTS payload for language=%s", normalized_language)
        return base64.b64encode(f"[{normalized_language}] {text}".encode("utf-8")).decode("ascii")


class VoiceService:
    def __init__(self) -> None:
        self.stt = SpeechToTextService()
        self.tts = TextToSpeechService()

    async def transcribe(self, content: bytes, language: str) -> str:
        return await self.stt.transcribe(content, language)

    async def synthesize(self, text: str, language: str) -> str:
        return await self.tts.synthesize(text, language)
