from datetime import date

from sqlalchemy import JSON, Date, Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id"))
    practiced_at: Mapped[date] = mapped_column(Date)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    distance_km: Mapped[float] = mapped_column(Float)
    maneuvers: Mapped[list[str]] = mapped_column(JSON, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    car_id: Mapped[int | None] = mapped_column(ForeignKey("cars.id"), nullable=True)
    # Foto "antes" opcional, só pra referência visual do aluno (comparar com o
    # resultado depois) — sem análise de IA, ao contrário da foto de resultado
    # em PracticeSessionFeedback, que já tem esse fluxo pronto.
    before_photo_path: Mapped[str | None] = mapped_column(Text, nullable=True)
