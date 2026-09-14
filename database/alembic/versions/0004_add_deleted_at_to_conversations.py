"""add deleted_at to chat_conversations

Revision ID: 0004_chat_deleted_at
Revises: 0003_chat_conversations
Create Date: 2026-09-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_chat_deleted_at"
down_revision: str | None = "0003_chat_conversations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Add deleted_at column to chat_conversations (inherited from Base but missing from 0003 migration)
    op.add_column(
        "chat_conversations",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("chat_conversations", "deleted_at")
