from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    learner_id: Mapped[int] = mapped_column(ForeignKey("learners.id"), unique=True)
    product_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    environment: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # Fonte da verdade de "ativo ou não": o RevenueCat manda o expiration_at_ms
    # real em todo evento, inclusive EXPIRATION (já no passado) e CANCELLATION
    # (ainda no futuro, porque o cancelamento só desliga o auto-renew — o
    # acesso continua até essa data). "Ativo" é sempre expires_at > agora, sem
    # precisar de um campo de status próprio nem de lógica por tipo de evento.
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
