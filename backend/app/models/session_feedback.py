from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PracticeSessionFeedback(Base):
    __tablename__ = "session_feedback"

    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id"))
    practice_session_id: Mapped[int] = mapped_column(ForeignKey("practice_sessions.id"))
    kind: Mapped[str] = mapped_column(String(10))  # "text" | "photo"
    message: Mapped[str] = mapped_column(Text)
    # Caminho relativo dentro de backend/media/, ex: "practice-sessions/12/uuid.jpg" —
    # só preenchido quando kind="photo".
    photo_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
