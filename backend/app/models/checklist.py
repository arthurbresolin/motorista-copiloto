from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    order: Mapped[int] = mapped_column()


checklist_session_items = Table(
    "checklist_session_items",
    Base.metadata,
    Column("session_id", ForeignKey("checklist_sessions.id"), primary_key=True),
    Column("checklist_item_id", ForeignKey("checklist_items.id"), primary_key=True),
)


class ChecklistSession(Base):
    __tablename__ = "checklist_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id"))
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    items: Mapped[list["ChecklistItem"]] = relationship(
        secondary=checklist_session_items, lazy="selectin"
    )
