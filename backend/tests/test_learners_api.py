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
