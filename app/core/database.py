from collections.abc import AsyncGenerator
from datetime import datetime
import socket

from sqlalchemy import DateTime, func, inspect
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings


class Base(DeclarativeBase):
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


def get_resolved_db_url() -> str:
    url = settings.database_url
    if "sqlite" in url:
        return url

    try:
        host = url.split("@")[-1].split(":")[0].split("/")[0]
    except Exception:
        host = ""

    if host and host not in {"localhost", "127.0.0.1"}:
        try:
            socket.getaddrinfo(host, None)
        except OSError:
            # Local development fallback when Docker service names are unavailable
            return "sqlite+aiosqlite:///./nurtureher.db"

    return url


resolved_url = get_resolved_db_url()
engine = create_async_engine(resolved_url, pool_pre_ping=True, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


def ensure_sqlite_schema_compatibility(connection: Connection) -> None:
    if connection.dialect.name != "sqlite":
        return

    table_name = "ppd_assessments"
    inspector = inspect(connection)
    if not inspector.has_table(table_name):
        return

    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    missing_columns = {
        "sentiment_score": "FLOAT NOT NULL DEFAULT 0.5",
        "combined_risk_score": "FLOAT NOT NULL DEFAULT 0.0",
        "recommendations": "TEXT",
    }
    for column_name, definition in missing_columns.items():
        if column_name not in existing_columns:
            connection.exec_driver_sql(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
