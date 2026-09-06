import base64
import logging

from app.services.translation_service import TranslationService

logger = logging.getLogger(__name__)


class SpeechToTextService:
    async def transcribe(self, content: bytes, language: str) -> str:
        """Transcribe audio content using OpenAI Whisper API if available.

        Falls back to the original placeholder text when the API key is not set
        or an error occurs.
        """
        normalized_language = TranslationService().normalize_language(language)
        logger.info("Received voice input for STT: bytes=%s language=%s", len(content), normalized_language)
        try:
            import os
            import openai
            import io
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                openai.api_key = api_key
                # OpenAI expects a file-like object with a name attribute
                audio_file = io.BytesIO(content)
                audio_file.name = f"voice.{normalized_language}.webm"
                transcript = await openai.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=normalized_language,
                )
                # transcript.text contains the recognized speech
                return transcript.text.strip()
        except Exception as e:
            logger.warning("OpenAI Whisper transcription failed: %s", e)
        # Fallback placeholder (preserves existing API contract)
        return f"Voice message transcribed in {normalized_language}. Audio size: {len(content)} bytes."



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
