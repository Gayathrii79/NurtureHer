import uuid
import pytest
from unittest.mock import AsyncMock, patch

from app.core.exceptions import AppError
from app.models.chat import ChatConversation, ChatMessage
from app.models.user import User
from app.schemas.health import ChatRequest
from app.services.chat_service import ChatbotService, generate_conversation_title
from app.services.memory_service import ConversationMemoryService


def test_deterministic_title_generation():
    # Requirement 5 test case
    assert generate_conversation_title("I'm having irregular periods") == "Irregular periods"
    assert generate_conversation_title("I am having severe cramps") == "Severe cramps"
    assert generate_conversation_title("Can you please help me with nausea?") == "Nausea"
    assert generate_conversation_title("Hello, what are the symptoms of PCOS?") == "Symptoms of PCOS"
    assert generate_conversation_title("enakku romba tired ah irukku") == "Enakku romba tired ah irukku"
    assert generate_conversation_title("   ") == "New Conversation"


def test_conversation_memory_service_key_isolation():
    service = ConversationMemoryService()
    user_id = uuid.uuid4()
    conv1 = uuid.uuid4()
    conv2 = uuid.uuid4()

    key_global = service._key(user_id)
    key_conv1 = service._key(user_id, conv1)
    key_conv2 = service._key(user_id, conv2)

    assert key_global == f"chat-memory:{user_id}"
    assert key_conv1 == f"chat-memory:{user_id}:{conv1}"
    assert key_conv2 == f"chat-memory:{user_id}:{conv2}"
    assert key_conv1 != key_conv2


@pytest.mark.asyncio
async def test_create_and_list_conversations():
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()
    service = ChatbotService(mock_db)

    user = User(
        id=uuid.uuid4(),
        name="Gayathri",
        email="gayathri@example.com",
        password_hash="hashed",
    )

    conv_id = uuid.uuid4()
    mock_conv = ChatConversation(id=conv_id, user_id=user.id, title="Irregular periods")

    with patch("app.services.chat_service.ChatConversationRepository") as mock_repo_class:
        mock_repo = AsyncMock()
        mock_repo_class.return_value = mock_repo
        mock_repo.create.return_value = mock_conv
        mock_repo.for_user.return_value = [mock_conv]

        created = await service.create_conversation(user, title="Irregular periods")
        assert created.id == conv_id
        assert created.title == "Irregular periods"
        mock_db.commit.assert_called_once()

        convs = await service.list_conversations(user)
        assert len(convs) == 1
        assert convs[0].id == conv_id


@pytest.mark.asyncio
async def test_user_isolation_security():
    mock_db = AsyncMock()
    service = ChatbotService(mock_db)

    user_a = User(id=uuid.uuid4(), name="User A", email="a@example.com", password_hash="h")
    user_b = User(id=uuid.uuid4(), name="User B", email="b@example.com", password_hash="h")
    target_conv_id = uuid.uuid4()

    with patch("app.services.chat_service.ChatConversationRepository") as mock_repo_class:
        mock_repo = AsyncMock()
        mock_repo_class.return_value = mock_repo
        # When User B queries User A's conversation, repo returns None
        mock_repo.get_for_user.return_value = None

        with pytest.raises(AppError) as exc_info:
            await service.get_conversation(user_b, target_conv_id)
        assert exc_info.value.status_code == 404

        with pytest.raises(AppError) as exc_info:
            await service.delete_conversation(user_b, target_conv_id)
        assert exc_info.value.status_code == 404

        with pytest.raises(AppError) as exc_info:
            await service.get_conversation_messages(user_b, target_conv_id)
        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_messages_in_separate_conversations_do_not_mix():
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()
    service = ChatbotService(mock_db)

    user = User(id=uuid.uuid4(), name="User", email="u@example.com", password_hash="h")
    conv1_id = uuid.uuid4()
    conv2_id = uuid.uuid4()

    conv1 = ChatConversation(id=conv1_id, user_id=user.id, title="PCOS Advice")
    conv2 = ChatConversation(id=conv2_id, user_id=user.id, title="Nutrition Plan")

    msg1 = ChatMessage(id=uuid.uuid4(), user_id=user.id, conversation_id=conv1_id, message="PCOS question", response="PCOS answer", language="en")
    msg2 = ChatMessage(id=uuid.uuid4(), user_id=user.id, conversation_id=conv2_id, message="Diet question", response="Diet answer", language="en")

    with patch("app.services.chat_service.ChatConversationRepository") as mock_conv_repo_class, \
         patch("app.services.chat_service.ChatRepository") as mock_chat_repo_class:

        mock_conv_repo = AsyncMock()
        mock_conv_repo_class.return_value = mock_conv_repo

        def fake_get_for_user(c_id, u_id):
            if c_id == conv1_id and u_id == user.id:
                return conv1
            if c_id == conv2_id and u_id == user.id:
                return conv2
            return None

        mock_conv_repo.get_for_user.side_effect = fake_get_for_user

        mock_chat_repo = AsyncMock()
        mock_chat_repo_class.return_value = mock_chat_repo

        def fake_for_conv(c_id, u_id, limit=100, offset=0):
            if c_id == conv1_id:
                return [msg1]
            if c_id == conv2_id:
                return [msg2]
            return []

        mock_chat_repo.for_conversation.side_effect = fake_for_conv

        conv1_messages = await service.get_conversation_messages(user, conv1_id)
        conv2_messages = await service.get_conversation_messages(user, conv2_id)

        assert len(conv1_messages) == 1
        assert conv1_messages[0].message == "PCOS question"

        assert len(conv2_messages) == 1
        assert conv2_messages[0].message == "Diet question"
        assert conv1_messages[0].conversation_id != conv2_messages[0].conversation_id


@pytest.mark.asyncio
async def test_message_sending_auto_creates_conversation_and_generates_title():
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()
    service = ChatbotService(mock_db)

    user = User(id=uuid.uuid4(), name="User", email="u@example.com", password_hash="h")
    conv_id = uuid.uuid4()
    mock_conv = ChatConversation(id=conv_id, user_id=user.id, title="Irregular periods")

    with patch.object(service.rag, "build_context", new_callable=AsyncMock) as mock_rag, \
         patch.object(service.memory, "get_recent_messages", new_callable=AsyncMock) as mock_mem_get, \
         patch.object(service.memory, "append", new_callable=AsyncMock) as mock_mem_append, \
         patch.object(service.gemini, "generate_response", new_callable=AsyncMock) as mock_gemini, \
         patch("app.services.chat_service.ChatConversationRepository") as mock_conv_repo_class, \
         patch("app.services.chat_service.ChatRepository") as mock_chat_repo_class:

        mock_rag.return_value = ("retrieved context", "user context")
        mock_mem_get.return_value = []
        mock_gemini.return_value = "Consult a gynecologist for period irregularity."

        mock_conv_repo = AsyncMock()
        mock_conv_repo_class.return_value = mock_conv_repo
        mock_conv_repo.create.return_value = mock_conv

        mock_chat_repo = AsyncMock()
        mock_chat_repo_class.return_value = mock_chat_repo
        mock_chat_msg = ChatMessage(
            id=uuid.uuid4(),
            user_id=user.id,
            conversation_id=conv_id,
            message="I'm having irregular periods",
            response=mock_gemini.return_value,
            language="en",
        )
        mock_chat_repo.create.return_value = mock_chat_msg

        # Sending message without conversation_id should auto-create conversation with title "Irregular periods"
        payload = ChatRequest(message="I'm having irregular periods", language="en")
        result = await service.message(user, payload)

        mock_conv_repo.create.assert_called_once_with(
            user_id=user.id,
            title="Irregular periods",
        )
        assert result.conversation_id == conv_id
        mock_mem_append.assert_called_once_with(
            user.id,
            "I'm having irregular periods",
            mock_gemini.return_value,
            conversation_id=conv_id,
        )
