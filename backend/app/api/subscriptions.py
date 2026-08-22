import hmac
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.learners import get_current_learner
from app.core.config import settings
from app.db.session import get_db
from app.models import Learner, Subscription
from app.schemas.subscription import RevenueCatWebhookPayload, SubscriptionRead

router = APIRouter(tags=["subscriptions"])


def _authorize_webhook(authorization: str | None) -> None:
    # Comparação de tempo constante (hmac.compare_digest) — não é sensível
    # aqui como seria pra um segredo de sessão, mas é o jeito padrão de
    # comparar segredo recebido contra segredo configurado, então segue o
    # mesmo padrão em vez de um "==" que teria que ser revisitado depois.
    expected = settings.revenuecat_webhook_secret
    received = (authorization or "").removeprefix("Bearer ").strip()
    if not expected or not hmac.compare_digest(received, expected):
        raise HTTPException(status_code=401, detail="webhook não autorizado")


@router.post("/subscriptions/revenuecat/webhook", status_code=200)
async def receive_revenuecat_webhook(
    payload: RevenueCatWebhookPayload,
    db: AsyncSession = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    _authorize_webhook(authorization)

    event = payload.event
    try:
        learner_id = int(event.app_user_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="learner não encontrado")

    learner = await db.get(Learner, learner_id)
    if learner is None:
        raise HTTPException(status_code=404, detail="learner não encontrado")

    result = await db.execute(select(Subscription).where(Subscription.learner_id == learner_id))
    subscription = result.scalar_one_or_none()
    if subscription is None:
        subscription = Subscription(learner_id=learner_id)
        db.add(subscription)

    subscription.product_id = event.product_id
    subscription.environment = event.environment
    subscription.expires_at = (
        datetime.fromtimestamp(event.expiration_at_ms / 1000, tz=timezone.utc)
        if event.expiration_at_ms is not None
        else None
    )
    await db.commit()

    return {"status": "ok"}


@router.get("/learners/me/subscription", response_model=SubscriptionRead)
async def get_subscription_status(
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    result = await db.execute(select(Subscription).where(Subscription.learner_id == learner.id))
    subscription = result.scalar_one_or_none()
    if subscription is None:
        return SubscriptionRead(active=False, product_id=None, expires_at=None)

    now = datetime.now(timezone.utc)
    expires_at = subscription.expires_at
    is_active = expires_at is not None and expires_at.replace(tzinfo=timezone.utc) > now
    return SubscriptionRead(
        active=is_active, product_id=subscription.product_id, expires_at=expires_at
    )
