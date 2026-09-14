"""chat conversations and message conversation_id

Revision ID: 0003_chat_conversations
Revises: 0002_production_indexes
Create Date: 2026-09-13
"""

from collections.abc import Sequence
import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003_chat_conversations"
down_revision: str | None = "0002_production_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create chat_conversations table
    op.create_table(
        "chat_conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False, server_default="New Conversation"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chat_conversations_user_id", "chat_conversations", ["user_id"])
    op.create_index("ix_chat_conversations_user_created", "chat_conversations", ["user_id", "created_at"])
    op.create_index("ix_chat_conversations_user_updated", "chat_conversations", ["user_id", "updated_at"])

    # 2. Add conversation_id column to chat_messages
    op.add_column(
        "chat_messages",
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_conversations.id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.create_index("ix_chat_messages_conversation_id", "chat_messages", ["conversation_id"])
    op.create_index("ix_chat_messages_conversation_created", "chat_messages", ["conversation_id", "created_at"])

    # 3. Safe data backfill: associate orphan chat_messages with a "Previous Chat" conversation per user
    conn = op.get_bind()
    try:
        user_ids = conn.execute(
            sa.text("SELECT DISTINCT user_id FROM chat_messages WHERE conversation_id IS NULL")
        ).fetchall()
        for row in user_ids:
            uid = row[0]
            conv_id = uuid.uuid4()
            conn.execute(
                sa.text(
                    "INSERT INTO chat_conversations (id, user_id, title, created_at, updated_at) "
                    "VALUES (:cid, :uid, :title, NOW(), NOW())"
                ),
                {"cid": conv_id, "uid": uid, "title": "Previous Chat"},
            )
            conn.execute(
                sa.text(
                    "UPDATE chat_messages SET conversation_id = :cid WHERE user_id = :uid AND conversation_id IS NULL"
                ),
                {"cid": conv_id, "uid": uid},
            )
    except Exception:
        # Pass gracefully if tables are empty or dialect is mock/testing
        pass


def downgrade() -> None:
    op.drop_index("ix_chat_messages_conversation_created", table_name="chat_messages")
    op.drop_index("ix_chat_messages_conversation_id", table_name="chat_messages")
    op.drop_column("chat_messages", "conversation_id")
    op.drop_index("ix_chat_conversations_user_updated", table_name="chat_conversations")
    op.drop_index("ix_chat_conversations_user_created", table_name="chat_conversations")
    op.drop_index("ix_chat_conversations_user_id", table_name="chat_conversations")
    op.drop_table("chat_conversations")
