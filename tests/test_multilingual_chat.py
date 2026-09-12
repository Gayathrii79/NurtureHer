import pytest
from unittest.mock import AsyncMock, patch

from app.models.user import User
from app.schemas.health import ChatRequest
from app.services.chat_service import ChatbotService
from app.services.translation_service import TranslationService


def test_scenario_1_english_input_defaults_to_english():
    service = TranslationService()
    message = "I have been experiencing severe cramps and headaches for two days."
    lang, source = service.resolve_language(message, selected_language="en")
    assert lang == "en"
    assert source == "default_fallback"


def test_scenario_2_tamil_script_input_resolves_to_tamil():
    service = TranslationService()
    message = "எனக்கு கடுமையான தலைவலி மற்றும் உடல் சோர்வு உள்ளது."
    lang, source = service.resolve_language(message, selected_language="en")
    assert lang == "ta"
    assert source == "detected_input"


def test_scenario_3_tanglish_input_resolves_to_tamil():
    service = TranslationService()
    message = "enakku romba tired ah irukku, udambu valikuthu"
    lang, source = service.resolve_language(message, selected_language="en")
    assert lang == "ta"
    assert source == "detected_input"


def test_scenario_4_tamil_input_with_explicit_kannada_request_overrides_to_kannada():
    service = TranslationService()
    message = "எனக்கு தலைவலி உள்ளது, please reply in Kannada"
    lang, source = service.resolve_language(message, selected_language="en")
    assert lang == "kn"
    assert source == "explicit_request"


def test_scenario_5_english_input_with_explicit_hindi_request_overrides_to_hindi():
    service = TranslationService()
    message = "I feel dizzy and exhausted, please answer in Hindi"
    lang, source = service.resolve_language(message, selected_language="en")
    assert lang == "hi"
    assert source == "explicit_request"


def test_scenario_6_kannada_script_input_resolves_to_kannada():
    service = TranslationService()
    message = "ನನಗೆ ತೀವ್ರವಾದ ಹೊಟ್ಟೆ ನೋವು ಮತ್ತು ಆಯಾಸವಿದೆ."
    lang, source = service.resolve_language(message, selected_language="en")
    assert lang == "kn"
    assert source == "detected_input"


def test_scenario_7_ambiguous_input_defaults_to_english_fallback():
    service = TranslationService()
    message = "ok thank you"
    lang, source = service.resolve_language(message, selected_language="en")
    assert lang == "en"
    assert source == "default_fallback"


def test_scenario_8_explicit_non_english_ui_preference_respected():
    service = TranslationService()
    # User chose Telugu in UI selector, but typed ordinary English symptom
    message = "I have back pain and nausea"
    lang, source = service.resolve_language(message, selected_language="te")
    assert lang == "te"
    assert source == "ui_preference"


def test_scenario_9_explicit_in_message_request_overrides_ui_preference():
    service = TranslationService()
    # User chose Hindi in UI selector, but explicitly asked for Tamil in the message
    message = "I have back pain, please answer in Tamil"
    lang, source = service.resolve_language(message, selected_language="hi")
    assert lang == "ta"
    assert source == "explicit_request"


def test_scenario_10_native_script_explicit_request():
    service = TranslationService()
    message = "ನನ್ನ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲಿ ಹೇಳಿ"
    assert service.extract_explicit_language_request(message) == "kn"

    message_ta = "தமிழில் பதில் சொல்லுங்கள்"
    assert service.extract_explicit_language_request(message_ta) == "ta"

    message_hi = "कृपया हिंदी में बताएं"
    assert service.extract_explicit_language_request(message_hi) == "hi"


def test_scenario_11_malayalam_and_telugu_script_detection():
    service = TranslationService()
    ml_message = "എനിക്ക് കഠിനമായ തലവേദനയുണ്ട്"
    lang_ml, source_ml = service.resolve_language(ml_message, selected_language="en")
    assert lang_ml == "ml"
    assert source_ml == "detected_input"

    te_message = "నాకు తీవ్రమైన తలనొప్పిగా ఉంది"
    lang_te, source_te = service.resolve_language(te_message, selected_language="en")
    assert lang_te == "te"
    assert source_te == "detected_input"


@pytest.mark.asyncio
async def test_chatbot_service_resolves_and_persists_language():
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()
    service = ChatbotService(mock_db)

    dummy_user = User(
        name="Anitha",
        email="anitha@example.com",
        password_hash="hashed",
        preferred_language="en",
    )

    with patch.object(service.rag, "build_context", new_callable=AsyncMock) as mock_build_context, \
         patch.object(service.memory, "get_recent_messages", new_callable=AsyncMock) as mock_memory, \
         patch.object(service.gemini, "generate_response", new_callable=AsyncMock) as mock_gemini, \
         patch("app.services.chat_service.ChatRepository") as mock_repo_class:

        mock_build_context.return_value = ("retrieved context", "user context")
        mock_memory.return_value = []
        mock_gemini.return_value = "உங்களுக்கு உதவ நான் இங்கே இருக்கிறேன். ஓய்வெடுக்கவும்."
        
        mock_repo_instance = AsyncMock()
        mock_repo_class.return_value = mock_repo_instance
        mock_chat_record = AsyncMock(
            id="chat-123",
            message="enakku romba tired ah irukku",
            response=mock_gemini.return_value,
            language="ta",
        )
        mock_repo_instance.create.return_value = mock_chat_record

        payload = ChatRequest(message="enakku romba tired ah irukku", language="en")
        result = await service.message(dummy_user, payload)

        # Verify that create was called with resolved language 'ta'
        mock_repo_instance.create.assert_called_once()
        call_kwargs = mock_repo_instance.create.call_args[1]
        assert call_kwargs["language"] == "ta"
        assert result.language == "ta"
