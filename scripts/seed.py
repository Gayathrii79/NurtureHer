import asyncio
import os

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import UserRole, hash_password
from app.models.caregiver import CaregiverContent
from app.models.user import User


async def ensure_user(db, email: str, name: str, password: str, role: UserRole) -> None:
    existing = await db.scalar(select(User).where(User.email == email))
    if existing:
        return
    db.add(User(email=email, name=name, password_hash=hash_password(password), role=role, is_verified=True))


async def ensure_content(db, title: str, description: str, category: str, video_url: str | None = None) -> None:
    existing = await db.scalar(select(CaregiverContent).where(CaregiverContent.title == title))
    if existing:
        return
    db.add(CaregiverContent(title=title, description=description, video_url=video_url, category=category))


async def main() -> None:
    async with AsyncSessionLocal() as db:
        admin_password = os.getenv("NURTUREHER_SEED_ADMIN_PASSWORD")
        asha_password = os.getenv("NURTUREHER_SEED_ASHA_PASSWORD")
        if admin_password:
            await ensure_user(db, "admin@nurtureher.local", "NurtureHer Admin", admin_password, UserRole.ADMIN)
        if asha_password:
            await ensure_user(db, "asha@nurtureher.local", "ASHA Worker", asha_password, UserRole.ASHA_WORKER)
        await ensure_content(
            db,
            "Newborn soothing basics",
            "Short educational video for safe soothing and bonding.",
            "video",
        )
        await ensure_content(db, "Share the load", "Offer concrete help with sleep, meals, and clinic visits.", "tip")
        await ensure_content(
            db,
            "Recognizing postpartum warning signs",
            "Guide for caregivers on when to encourage urgent clinical care.",
            "article",
        )
        await db.commit()


if __name__ == "__main__":
    asyncio.run(main())
