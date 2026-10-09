import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import RiskLevel

if TYPE_CHECKING:
    from app.models.user import User


class PPDAssessment(Base):
    __tablename__ = "ppd_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    epds_score: Mapped[int] = mapped_column(Integer, nullable=False)
    sentiment: Mapped[str] = mapped_column(String(40), nullable=False)
    sentiment_score: Mapped[float] = mapped_column(Float, nullable=False, server_default="0.5")
    combined_risk_score: Mapped[float] = mapped_column(Float, nullable=False, server_default="0.0")
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel, name="ppd_risk_level"), nullable=False)
    recommendations: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship(back_populates="ppd_assessments")
