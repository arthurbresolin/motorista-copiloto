from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MonitorSession(Base):
    __tablename__ = "monitor_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[int] = mapped_column(Integer)
    event_count: Mapped[int] = mapped_column(Integer)
    severe_event_count: Mapped[int] = mapped_column(Integer, default=0)
    route: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
