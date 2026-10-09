from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.redis import redis_client
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.repositories.audit import RefreshTokenRepository
from app.schemas.auth import TokenPair


class TokenService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.refresh_tokens = RefreshTokenRepository(db)

    async def issue_pair(self, user: User) -> TokenPair:
        refresh_jti = str(uuid4())
        refresh_token = create_refresh_token(user.id, refresh_jti)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
        await self.refresh_tokens.create(user_id=user.id, token_jti=refresh_jti, expires_at=expires_at)
        await redis_client.setex(self._refresh_key(refresh_jti), settings.refresh_token_expire_days * 86400, str(user.id))
        return TokenPair(access_token=create_access_token(user.id), refresh_token=refresh_token)

    async def rotate_refresh_token(self, refresh_token: str) -> tuple[str, dict]:
        payload = decode_token(refresh_token, "refresh")
        jti = payload.get("jti")
        if not jti:
            raise ValueError("Refresh token missing id")
        user_id = await redis_client.get(self._refresh_key(jti))
        if user_id is not None and user_id != payload["sub"]:
            raise ValueError("Refresh token mismatch")

        # Redis is a fast cache; the refresh_tokens row is authoritative, so a
        # missing Redis key (broker down, eviction, restart) must not hard-fail
        # refresh - that would silently log every user out when the access token
        # expires. Rotation is still single-use: the row is marked revoked below
        # and the Redis key deleted, so replaying a used token is rejected.
        token_record = await self._get_by_jti(jti)
        if token_record is not None and str(token_record.user_id) != payload["sub"]:
            raise ValueError("Refresh token mismatch")
        now = datetime.now(timezone.utc)
        db_valid = False
        if token_record is not None:
            expires_at = token_record.expires_at
            if expires_at is not None and expires_at.tzinfo is None:
                # SQLite returns naive UTC timestamps; Postgres returns aware ones.
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if token_record.revoked_at is not None or (
                expires_at is not None and expires_at <= now
            ):
                raise ValueError("Refresh token has expired or was already used")
            token_record.revoked_at = now
            await self.db.flush()
            db_valid = True
        if not db_valid and user_id is None:
            # Neither store knows this token: reject (expired, used, or forged).
            raise ValueError("Refresh token has expired or was already used")
        await redis_client.delete(self._refresh_key(jti))
        return payload["sub"], payload

    async def revoke_refresh_token(self, refresh_token: str) -> None:
        payload = decode_token(refresh_token, "refresh")
        jti = payload.get("jti")
        if jti:
            await redis_client.delete(self._refresh_key(jti))
            token_record = await self._get_by_jti(jti)
            if token_record:
                token_record.revoked_at = datetime.now(timezone.utc)
                await self.db.flush()

    def _refresh_key(self, jti: str) -> str:
        return f"refresh-token:{jti}"

    async def revoke_all_for_user(self, user_id: UUID) -> None:
        records = await self.refresh_tokens.active_for_user(user_id)
        now = datetime.now(timezone.utc)
        for record in records:
            record.revoked_at = now
            await redis_client.delete(self._refresh_key(record.token_jti))
        await self.db.flush()

    async def _get_by_jti(self, jti: str):
        return await self.refresh_tokens.get_by_jti(jti)
