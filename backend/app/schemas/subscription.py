from datetime import datetime

from pydantic import BaseModel


class RevenueCatWebhookEvent(BaseModel):
    type: str
    app_user_id: str
    product_id: str | None = None
    expiration_at_ms: int | None = None
    environment: str | None = None


class RevenueCatWebhookPayload(BaseModel):
    event: RevenueCatWebhookEvent


class SubscriptionRead(BaseModel):
    active: bool
    product_id: str | None
    expires_at: datetime | None
