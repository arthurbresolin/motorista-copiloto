from app.core.config import settings

REGISTER_PAYLOAD = {"email": "assinante@example.com", "password": "senha1234"}
WEBHOOK_SECRET = "segredo-de-teste"


async def _registered_learner(client):
    register = await client.post("/learners/register", json=REGISTER_PAYLOAD)
    access_token = register.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    me = await client.get("/learners/me", headers=headers)
    return me.json()["id"], headers


def _event(app_user_id: str, expiration_at_ms: int | None, **overrides) -> dict:
    return {
        "event": {
            "type": overrides.pop("type", "INITIAL_PURCHASE"),
            "app_user_id": app_user_id,
            "product_id": overrides.pop("product_id", "premium_mensal"),
            "expiration_at_ms": expiration_at_ms,
            "environment": overrides.pop("environment", "SANDBOX"),
        }
    }


async def test_webhook_rejects_missing_authorization(client, session_factory, monkeypatch):
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", WEBHOOK_SECRET)

    response = await client.post(
        "/subscriptions/revenuecat/webhook", json=_event("1", 9999999999000)
    )

    assert response.status_code == 401


async def test_webhook_rejects_wrong_authorization(client, session_factory, monkeypatch):
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", WEBHOOK_SECRET)

    response = await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event("1", 9999999999000),
        headers={"Authorization": "Bearer errado"},
    )

    assert response.status_code == 401


async def test_webhook_rejects_when_secret_not_configured(client, session_factory, monkeypatch):
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", None)

    response = await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event("1", 9999999999000),
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"},
    )

    assert response.status_code == 401


async def test_webhook_rejects_unknown_learner(client, session_factory, monkeypatch):
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", WEBHOOK_SECRET)

    response = await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event("999999", 9999999999000),
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"},
    )

    assert response.status_code == 404


async def test_subscription_status_defaults_to_inactive(client, session_factory):
    _, headers = await _registered_learner(client)

    response = await client.get("/learners/me/subscription", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["active"] is False
    assert body["expires_at"] is None


async def test_webhook_activates_subscription(client, session_factory, monkeypatch):
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", WEBHOOK_SECRET)
    learner_id, headers = await _registered_learner(client)

    webhook_response = await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event(str(learner_id), 9999999999000),
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"},
    )
    status_response = await client.get("/learners/me/subscription", headers=headers)

    assert webhook_response.status_code == 200
    body = status_response.json()
    assert body["active"] is True
    assert body["product_id"] == "premium_mensal"


async def test_webhook_expiration_event_deactivates_subscription(
    client, session_factory, monkeypatch
):
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", WEBHOOK_SECRET)
    learner_id, headers = await _registered_learner(client)
    await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event(str(learner_id), 9999999999000),
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"},
    )

    await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event(str(learner_id), 1000, type="EXPIRATION"),
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"},
    )
    status_response = await client.get("/learners/me/subscription", headers=headers)

    assert status_response.json()["active"] is False


async def test_webhook_upserts_same_learner_subscription(client, session_factory, monkeypatch):
    monkeypatch.setattr(settings, "revenuecat_webhook_secret", WEBHOOK_SECRET)
    learner_id, headers = await _registered_learner(client)

    await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event(str(learner_id), 9999999999000, product_id="premium_mensal"),
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"},
    )
    await client.post(
        "/subscriptions/revenuecat/webhook",
        json=_event(str(learner_id), 9999999999000, type="RENEWAL", product_id="premium_anual"),
        headers={"Authorization": f"Bearer {WEBHOOK_SECRET}"},
    )
    status_response = await client.get("/learners/me/subscription", headers=headers)

    assert status_response.json()["product_id"] == "premium_anual"


async def test_subscription_status_requires_auth(client, session_factory):
    response = await client.get("/learners/me/subscription")

    assert response.status_code == 401
