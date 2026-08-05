REGISTER_PAYLOAD = {"email": "instrutor@example.com", "password": "senha1234", "name": "Prof. Ana"}


async def _create_invite(client, auth_headers):
    response = await client.post("/instructors/invites", headers=auth_headers)
    return response.json()["token"]


async def _accept_invite(client, token, payload=None):
    return await client.post(f"/instructors/invites/{token}/accept", json=payload or REGISTER_PAYLOAD)


async def test_create_invite(client, session_factory, auth_headers):
    response = await client.post("/instructors/invites", headers=auth_headers)

    assert response.status_code == 201
    assert len(response.json()["token"]) > 10


async def test_create_invite_requires_auth(client, session_factory):
    response = await client.post("/instructors/invites")

    assert response.status_code == 401


async def test_invite_status_valid_before_use(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)

    response = await client.get(f"/instructors/invites/{token}")

    assert response.status_code == 200
    assert response.json() == {"valid": True}


async def test_invite_status_unknown_token(client, session_factory):
    response = await client.get("/instructors/invites/nao-existe")

    assert response.status_code == 200
    assert response.json() == {"valid": False}


async def test_accept_invite_creates_instructor_and_returns_token(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)

    response = await _accept_invite(client, token)

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 10


async def test_invite_cannot_be_used_twice(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)
    await _accept_invite(client, token)

    response = await _accept_invite(
        client, token, {**REGISTER_PAYLOAD, "email": "outro@example.com"}
    )

    assert response.status_code == 404


async def test_accept_invite_rejects_unknown_token(client, session_factory):
    response = await _accept_invite(client, "token-invalido")

    assert response.status_code == 404


async def test_accept_invite_rejects_duplicate_email(client, session_factory, auth_headers):
    first_token = await _create_invite(client, auth_headers)
    await _accept_invite(client, first_token)

    second_token = await _create_invite(client, auth_headers)
    response = await _accept_invite(client, second_token)

    assert response.status_code == 409


async def test_accept_invite_rejects_short_password(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)

    response = await _accept_invite(client, token, {**REGISTER_PAYLOAD, "password": "123"})

    assert response.status_code == 422


async def test_login_with_correct_credentials(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)
    await _accept_invite(client, token)

    response = await client.post(
        "/instructors/login",
        json={"email": REGISTER_PAYLOAD["email"], "password": REGISTER_PAYLOAD["password"]},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"


async def test_login_with_wrong_password(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)
    await _accept_invite(client, token)

    response = await client.post(
        "/instructors/login", json={"email": REGISTER_PAYLOAD["email"], "password": "senha-errada"}
    )

    assert response.status_code == 401


async def test_login_with_unknown_email(client, session_factory):
    response = await client.post(
        "/instructors/login", json={"email": "ninguem@example.com", "password": "senha1234"}
    )

    assert response.status_code == 401


async def test_me_requires_valid_token(client, session_factory):
    response = await client.get("/instructors/me")

    assert response.status_code == 401  # HTTPBearer sem header


async def test_me_rejects_garbage_token(client, session_factory):
    response = await client.get("/instructors/me", headers={"Authorization": "Bearer garbage"})

    assert response.status_code == 401


async def test_me_returns_instructor_profile(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)
    accept_response = await _accept_invite(client, token)
    access_token = accept_response.json()["access_token"]

    response = await client.get("/instructors/me", headers={"Authorization": f"Bearer {access_token}"})

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == REGISTER_PAYLOAD["email"]
    assert body["name"] == REGISTER_PAYLOAD["name"]


async def test_overview_requires_auth(client, session_factory):
    response = await client.get("/instructors/overview")

    assert response.status_code == 401


async def test_overview_returns_student_progress(client, session_factory, auth_headers):
    token = await _create_invite(client, auth_headers)
    accept_response = await _accept_invite(client, token)
    access_token = accept_response.json()["access_token"]

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

    response = await client.get(
        "/instructors/overview", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["practice_sessions"]) == 1
    assert body["practice_stats"]["total_sessions"] == 1
    assert body["checklist_sessions"] == []
    assert body["monitor_sessions"] == []
    assert body["quiz_sessions"] == []


async def test_overview_does_not_show_other_learners_data(client, session_factory, auth_headers):
    """O instrutor só deve ver os dados do aluno que gerou o convite dele —
    não dados de qualquer outro aluno cadastrado no sistema."""
    token = await _create_invite(client, auth_headers)
    accept_response = await _accept_invite(client, token)
    access_token = accept_response.json()["access_token"]

    await client.post(
        "/learners/register", json={"email": "outro-aluno@example.com", "password": "senha1234"}
    )
    other_login = await client.post(
        "/learners/login", json={"email": "outro-aluno@example.com", "password": "senha1234"}
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}
    await client.post(
        "/practice-sessions",
        json={
            "practiced_at": "2026-07-10",
            "duration_minutes": 99,
            "distance_km": 99.0,
            "maneuvers": ["rotatória"],
        },
        headers=other_headers,
    )

    response = await client.get(
        "/instructors/overview", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    assert response.json()["practice_sessions"] == []
