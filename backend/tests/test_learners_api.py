from datetime import datetime, timedelta, timezone

import resend

from app.core.config import settings

REGISTER_PAYLOAD = {"email": "aluno@example.com", "password": "senha1234", "name": "João"}


async def test_register_learner(client, session_factory):
    response = await client.post("/learners/register", json=REGISTER_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 10


async def test_register_learner_rejects_short_password(client, session_factory):
    response = await client.post(
        "/learners/register", json={**REGISTER_PAYLOAD, "password": "123"}
    )

    assert response.status_code == 422


async def test_register_learner_rejects_duplicate_email(client, session_factory):
    await client.post("/learners/register", json=REGISTER_PAYLOAD)

    response = await client.post("/learners/register", json=REGISTER_PAYLOAD)

    assert response.status_code == 409


async def test_login_with_correct_credentials(client, session_factory):
    await client.post("/learners/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/learners/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


async def test_login_with_wrong_password(client, session_factory):
    await client.post("/learners/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/learners/login", json={"email": REGISTER_PAYLOAD["email"], "password": "senha-errada"}
    )

    assert response.status_code == 401


async def test_login_with_unknown_email(client, session_factory):
    response = await client.post(
        "/learners/login", json={"email": "ninguem@example.com", "password": "senha1234"}
    )

    assert response.status_code == 401


async def test_me_requires_valid_token(client, session_factory):
    response = await client.get("/learners/me")

    assert response.status_code == 401


async def test_me_rejects_garbage_token(client, session_factory):
    response = await client.get("/learners/me", headers={"Authorization": "Bearer garbage"})

    assert response.status_code == 401


async def test_me_returns_learner_profile(client, session_factory):
    register_response = await client.post("/learners/register", json=REGISTER_PAYLOAD)
    access_token = register_response.json()["access_token"]

    response = await client.get(
        "/learners/me", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == REGISTER_PAYLOAD["email"]
    assert body["name"] == REGISTER_PAYLOAD["name"]
    assert body["username"] is None
    assert body["display_name"] is None
    assert body["avatar_url"] is None
    assert body["theme_preference"] is None
    assert body["notifications_enabled"] is True


async def test_instructor_token_cannot_be_used_as_learner_token(client, session_factory):
    """Prova de que a claim "role" impede um token de instrutor de ser
    aceito num endpoint de aluno, mesmo que decodifique com sucesso."""
    invite = await client.post("/instructors/invites", headers=await _learner_auth(client))
    token = invite.json()["token"]
    accept_response = await client.post(
        f"/instructors/invites/{token}/accept",
        json={"email": "instrutor@example.com", "password": "senha1234"},
    )
    instructor_access_token = accept_response.json()["access_token"]

    response = await client.get(
        "/learners/me", headers={"Authorization": f"Bearer {instructor_access_token}"}
    )

    assert response.status_code == 401


async def _learner_auth(client):
    await client.post("/learners/register", json=REGISTER_PAYLOAD)
    login = await client.post(
        "/learners/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_update_profile_partial_update(client, session_factory, auth_headers):
    response = await client.patch(
        "/learners/me", json={"username": "joaozinho"}, headers=auth_headers
    )

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "joaozinho"
    assert body["display_name"] is None  # campo não enviado não deve mudar


async def test_update_profile_theme_preference(client, session_factory, auth_headers):
    response = await client.patch(
        "/learners/me", json={"theme_preference": "dark"}, headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json()["theme_preference"] == "dark"


async def test_update_profile_rejects_invalid_theme(client, session_factory, auth_headers):
    response = await client.patch(
        "/learners/me", json={"theme_preference": "roxo"}, headers=auth_headers
    )

    assert response.status_code == 422


async def test_update_profile_requires_auth(client, session_factory):
    response = await client.patch("/learners/me", json={"username": "x"})

    assert response.status_code == 401


async def test_update_profile_notifications_toggle(client, session_factory, auth_headers):
    response = await client.patch(
        "/learners/me", json={"notifications_enabled": False}, headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json()["notifications_enabled"] is False


async def test_change_password_with_correct_current_password(client, session_factory, auth_headers):
    response = await client.post(
        "/learners/me/change-password",
        json={"current_password": "senha1234", "new_password": "novasenha123"},
        headers=auth_headers,
    )

    assert response.status_code == 200

    login = await client.post(
        "/learners/login",
        json={"email": "aluno-teste@example.com", "password": "novasenha123"},
    )
    assert login.status_code == 200


async def test_change_password_rejects_wrong_current_password(client, session_factory, auth_headers):
    response = await client.post(
        "/learners/me/change-password",
        json={"current_password": "senha-errada", "new_password": "novasenha123"},
        headers=auth_headers,
    )

    assert response.status_code == 401


async def test_change_password_rejects_short_new_password(client, session_factory, auth_headers):
    response = await client.post(
        "/learners/me/change-password",
        json={"current_password": "senha1234", "new_password": "123"},
        headers=auth_headers,
    )

    assert response.status_code == 422


async def test_upload_avatar_accepts_jpeg(client, session_factory, auth_headers):
    response = await client.post(
        "/learners/me/avatar",
        files={"file": ("foto.jpg", b"fake-jpeg-bytes", "image/jpeg")},
        headers=auth_headers,
    )

    assert response.status_code == 200
    avatar_url = response.json()["avatar_url"]
    assert avatar_url is not None
    assert avatar_url.startswith("/media/avatars/")


async def test_upload_avatar_rejects_unsupported_type(client, session_factory, auth_headers):
    response = await client.post(
        "/learners/me/avatar",
        files={"file": ("arquivo.txt", b"nao e imagem", "text/plain")},
        headers=auth_headers,
    )

    assert response.status_code == 422


async def test_upload_avatar_replaces_previous_one(client, session_factory, auth_headers):
    first = await client.post(
        "/learners/me/avatar",
        files={"file": ("foto1.jpg", b"conteudo-1", "image/jpeg")},
        headers=auth_headers,
    )
    second = await client.post(
        "/learners/me/avatar",
        files={"file": ("foto2.png", b"conteudo-2", "image/png")},
        headers=auth_headers,
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["avatar_url"] != second.json()["avatar_url"]


async def test_delete_account_removes_learner_and_owned_data(client, session_factory, auth_headers):
    await client.post(
        "/cars", json={"brand_model": "Fiat Argo 2022"}, headers=auth_headers
    )
    await client.post(
        "/practice-sessions",
        json={
            "practiced_at": "2026-07-10",
            "duration_minutes": 20,
            "distance_km": 5.0,
            "maneuvers": ["baliza"],
        },
        headers=auth_headers,
    )

    response = await client.delete("/learners/me", headers=auth_headers)
    assert response.status_code == 200

    # token não funciona mais porque o aluno não existe
    me_response = await client.get("/learners/me", headers=auth_headers)
    assert me_response.status_code == 401

    async with session_factory() as session:
        from sqlalchemy import select as sa_select

        from app.models import Car, Learner, PracticeSession

        assert (await session.execute(sa_select(Learner))).scalars().all() == []
        assert (await session.execute(sa_select(Car))).scalars().all() == []
        assert (await session.execute(sa_select(PracticeSession))).scalars().all() == []


async def test_delete_account_requires_auth(client, session_factory):
    response = await client.delete("/learners/me")

    assert response.status_code == 401


GENERIC_RESET_MESSAGE = {
    "message": "se esse e-mail tiver uma conta, você vai receber um link de redefinição"
}


async def test_password_reset_request_generic_message_for_unknown_email(client, session_factory):
    response = await client.post(
        "/learners/password-reset/request", json={"email": "ninguem@example.com"}
    )

    assert response.status_code == 200
    assert response.json() == GENERIC_RESET_MESSAGE


async def test_password_reset_request_skips_silently_without_resend_configured(
    client, session_factory, monkeypatch
):
    monkeypatch.setattr(settings, "resend_api_key", None)
    await client.post("/learners/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/learners/password-reset/request", json={"email": REGISTER_PAYLOAD["email"]}
    )

    assert response.status_code == 200
    assert response.json() == GENERIC_RESET_MESSAGE

    from sqlalchemy import select as sa_select

    from app.models import PasswordResetToken

    async with session_factory() as session:
        rows = (await session.execute(sa_select(PasswordResetToken))).scalars().all()
    assert rows == []


async def test_password_reset_request_creates_token_and_sends_email(
    client, session_factory, monkeypatch
):
    monkeypatch.setattr(settings, "resend_api_key", "fake-key")
    monkeypatch.setattr(settings, "web_url", "https://app.example.com")

    sent = {}

    async def fake_send_async(cls, params, options=None):
        sent.update(params)
        return {"id": "fake-email-id"}

    monkeypatch.setattr(resend.Emails, "send_async", classmethod(fake_send_async))

    await client.post("/learners/register", json=REGISTER_PAYLOAD)

    response = await client.post(
        "/learners/password-reset/request", json={"email": REGISTER_PAYLOAD["email"]}
    )

    assert response.status_code == 200
    assert response.json() == GENERIC_RESET_MESSAGE
    assert sent["to"] == [REGISTER_PAYLOAD["email"]]
    assert "redefinir-senha?token=" in sent["html"]

    from sqlalchemy import select as sa_select

    from app.models import PasswordResetToken

    async with session_factory() as session:
        rows = (await session.execute(sa_select(PasswordResetToken))).scalars().all()
    assert len(rows) == 1
    assert rows[0].used_at is None


async def test_password_reset_confirm_with_valid_token_changes_password(client, session_factory):
    register = await client.post("/learners/register", json=REGISTER_PAYLOAD)
    access_token = register.json()["access_token"]
    me = await client.get("/learners/me", headers={"Authorization": f"Bearer {access_token}"})
    learner_id = me.json()["id"]

    from app.models import PasswordResetToken

    async with session_factory() as session:
        reset_token = PasswordResetToken(
            learner_id=learner_id,
            token="valid-token-123",
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1),
        )
        session.add(reset_token)
        await session.commit()

    response = await client.post(
        "/learners/password-reset/confirm",
        json={"token": "valid-token-123", "new_password": "novasenha123"},
    )

    assert response.status_code == 200

    old_login = await client.post(
        "/learners/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )
    assert old_login.status_code == 401

    new_login = await client.post(
        "/learners/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": "novasenha123"},
    )
    assert new_login.status_code == 200


async def test_password_reset_confirm_rejects_unknown_token(client, session_factory):
    response = await client.post(
        "/learners/password-reset/confirm",
        json={"token": "nao-existe", "new_password": "novasenha123"},
    )

    assert response.status_code == 400


async def test_password_reset_confirm_rejects_expired_token(client, session_factory):
    register = await client.post("/learners/register", json=REGISTER_PAYLOAD)
    access_token = register.json()["access_token"]
    me = await client.get("/learners/me", headers={"Authorization": f"Bearer {access_token}"})
    learner_id = me.json()["id"]

    from app.models import PasswordResetToken

    async with session_factory() as session:
        reset_token = PasswordResetToken(
            learner_id=learner_id,
            token="expired-token",
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1),
        )
        session.add(reset_token)
        await session.commit()

    response = await client.post(
        "/learners/password-reset/confirm",
        json={"token": "expired-token", "new_password": "novasenha123"},
    )

    assert response.status_code == 400


async def test_password_reset_confirm_rejects_already_used_token(client, session_factory):
    register = await client.post("/learners/register", json=REGISTER_PAYLOAD)
    access_token = register.json()["access_token"]
    me = await client.get("/learners/me", headers={"Authorization": f"Bearer {access_token}"})
    learner_id = me.json()["id"]

    from app.models import PasswordResetToken

    async with session_factory() as session:
        reset_token = PasswordResetToken(
            learner_id=learner_id,
            token="used-token",
            used_at=datetime.now(timezone.utc).replace(tzinfo=None),
            expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1),
        )
        session.add(reset_token)
        await session.commit()

    response = await client.post(
        "/learners/password-reset/confirm",
        json={"token": "used-token", "new_password": "novasenha123"},
    )

    assert response.status_code == 400


async def test_password_reset_confirm_rejects_short_new_password(client, session_factory):
    response = await client.post(
        "/learners/password-reset/confirm",
        json={"token": "qualquer", "new_password": "123"},
    )

    assert response.status_code == 422
