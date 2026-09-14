from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import PaginationParams, get_current_user, pagination_params
from app.core.database import get_db
from app.models.user import User
from app.schemas.health import (
    ChatConversationCreate,
    ChatConversationDetailRead,
    ChatConversationRead,
    ChatRead,
    ChatRequest,
)
from app.services.health import ChatService
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/chat", tags=["AI Health Coach"])


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    language: str = Field(default="en", min_length=2, max_length=16)


class TTSResponse(BaseModel):
    audio_base64: str
    encoding: str = "base64"
    media_type: str = "audio/plain"


@router.post("/conversations", response_model=ChatConversationRead, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ChatConversationCreate | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    title = payload.title if payload else None
    return await ChatService(db).create_conversation(user, title)


@router.get("/conversations", response_model=list[ChatConversationRead])
async def list_conversations(
    pagination: PaginationParams = Depends(pagination_params),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).list_conversations(user, pagination.limit, pagination.offset)


@router.get("/conversations/{conversation_id}", response_model=ChatConversationDetailRead)
async def get_conversation(
    conversation_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await ChatService(db).get_conversation(user, conversation_id)
    messages = await ChatService(db).get_conversation_messages(user, conversation_id)
    return ChatConversationDetailRead(
        id=conv.id,
        user_id=conv.user_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatRead])
async def get_conversation_messages(
    conversation_id: UUID,
    pagination: PaginationParams = Depends(pagination_params),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).get_conversation_messages(user, conversation_id, pagination.limit, pagination.offset)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService(db).delete_conversation(user, conversation_id)


@router.post("/message", response_model=ChatRead)
async def message(payload: ChatRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await ChatService(db).message(user, payload)


@router.post("/voice", response_model=ChatRead)
async def voice(
    language: str = "en",
    conversation_id: UUID | None = Query(None),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    transcript = await VoiceService().transcribe(content, language)
    return await ChatService(db).message(
        user,
        ChatRequest(message=transcript, language=language, conversation_id=conversation_id),
    )


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(payload: TTSRequest, _: User = Depends(get_current_user)):
    audio = await VoiceService().synthesize(payload.text, payload.language)
    return TTSResponse(audio_base64=audio)


@router.get("/history", response_model=list[ChatRead])
async def history(
    pagination: PaginationParams = Depends(pagination_params),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).history(user, pagination.limit, pagination.offset)
