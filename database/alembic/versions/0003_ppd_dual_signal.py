"""add ppd sentiment scoring fields

Revision ID: 0003_ppd_dual_signal
Revises: 0002_production_indexes
Create Date: 2026-09-18
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "0003_ppd_dual_signal"
down_revision: str | None = "0002_production_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("ppd_assessments", sa.Column("sentiment_score", sa.Float(), nullable=False, server_default="0.5"))
    op.add_column("ppd_assessments", sa.Column("combined_risk_score", sa.Float(), nullable=False, server_default="0.0"))
    op.add_column("ppd_assessments", sa.Column("recommendations", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("ppd_assessments", "recommendations")
    op.drop_column("ppd_assessments", "combined_risk_score")
    op.drop_column("ppd_assessments", "sentiment_score")
