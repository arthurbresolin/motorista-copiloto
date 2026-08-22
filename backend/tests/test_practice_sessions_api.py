VALID_PAYLOAD = {
    "practiced_at": "2026-07-10",
    "duration_minutes": 45,
    "distance_km": 12.5,
    "maneuvers": ["baliza", "rotatória"],
    "notes": "foi bem em geral",
}


async def test_create_practice_session(client, session_factory, auth_headers):
    response = await client.post("/practice-sessions", json=VALID_PAYLOAD, headers=auth_headers)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["practiced_at"] == "2026-07-10"
    assert body["duration_minutes"] == 45
    assert body["distance_km"] == 12.5
    assert body["maneuvers"] == ["baliza", "rotatória"]
    assert body["notes"] == "foi bem em geral"


async def test_create_practice_session_requires_auth(client, session_factory):
    response = await client.post("/practice-sessions", json=VALID_PAYLOAD)

    assert response.status_code == 401


async def test_create_practice_session_rejects_missing_required_fields(
    client, session_factory, auth_headers
):
    response = await client.post(
        "/practice-sessions", json={"practiced_at": "2026-07-10"}, headers=auth_headers
    )

    assert response.status_code == 422


async def test_create_practice_session_rejects_non_positive_numbers(
    client, session_factory, auth_headers
):
    payload = {**VALID_PAYLOAD, "duration_minutes": 0}

    response = await client.post("/practice-sessions", json=payload, headers=auth_headers)

    assert response.status_code == 422


async def test_list_practice_sessions_most_recent_first(client, session_factory, auth_headers):
    older = {**VALID_PAYLOAD, "practiced_at": "2026-07-01"}
    newer = {**VALID_PAYLOAD, "practiced_at": "2026-07-10"}

    await client.post("/practice-sessions", json=older, headers=auth_headers)
    await client.post("/practice-sessions", json=newer, headers=auth_headers)

    response = await client.get("/practice-sessions", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["practiced_at"] == "2026-07-10"
    assert body[1]["practiced_at"] == "2026-07-01"


async def test_get_practice_session_by_id(client, session_factory, auth_headers):
    created = await client.post("/practice-sessions", json=VALID_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.get(f"/practice-sessions/{session_id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == session_id


async def test_get_practice_session_by_id_not_found(client, session_factory, auth_headers):
    response = await client.get("/practice-sessions/999", headers=auth_headers)

    assert response.status_code == 404


async def test_create_practice_session_with_car(client, session_factory, auth_headers):
    car = await client.post(
        "/cars", json={"brand_model": "Fiat Argo 2022"}, headers=auth_headers
    )
    car_id = car.json()["id"]

    response = await client.post(
        "/practice-sessions", json={**VALID_PAYLOAD, "car_id": car_id}, headers=auth_headers
    )

    assert response.status_code == 201
    assert response.json()["car_id"] == car_id


async def test_create_practice_session_without_car(client, session_factory, auth_headers):
    response = await client.post("/practice-sessions", json=VALID_PAYLOAD, headers=auth_headers)

    assert response.status_code == 201
    assert response.json()["car_id"] is None


async def test_practice_session_stats_empty_db(client, session_factory, auth_headers):
    response = await client.get("/practice-sessions/stats", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"total_sessions": 0, "total_minutes": 0, "total_km": 0.0}


async def test_practice_session_stats_aggregates(client, session_factory, auth_headers):
    await client.post(
        "/practice-sessions",
        json={**VALID_PAYLOAD, "duration_minutes": 45, "distance_km": 12.5},
        headers=auth_headers,
    )
    await client.post(
        "/practice-sessions",
        json={**VALID_PAYLOAD, "duration_minutes": 30, "distance_km": 8.0},
        headers=auth_headers,
    )

    response = await client.get("/practice-sessions/stats", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total_sessions"] == 2
    assert body["total_minutes"] == 75
    assert body["total_km"] == 20.5


async def test_upload_before_photo_accepts_jpeg(client, session_factory, auth_headers):
    created = await client.post("/practice-sessions", json=VALID_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/practice-sessions/{session_id}/before-photo",
        files={"file": ("antes.jpg", b"fake-jpeg-bytes", "image/jpeg")},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["before_photo_url"] is not None
    assert body["before_photo_url"].startswith(f"/media/practice-sessions/{session_id}/before-")


async def test_upload_before_photo_rejects_unsupported_type(client, session_factory, auth_headers):
    created = await client.post("/practice-sessions", json=VALID_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/practice-sessions/{session_id}/before-photo",
        files={"file": ("arquivo.txt", b"nao e imagem", "text/plain")},
        headers=auth_headers,
    )

    assert response.status_code == 422


async def test_upload_before_photo_not_found(client, session_factory, auth_headers):
    response = await client.post(
        "/practice-sessions/999/before-photo",
        files={"file": ("antes.jpg", b"fake-jpeg-bytes", "image/jpeg")},
        headers=auth_headers,
    )

    assert response.status_code == 404


async def test_upload_before_photo_requires_auth(client, session_factory):
    response = await client.post(
        "/practice-sessions/1/before-photo",
        files={"file": ("antes.jpg", b"fake-jpeg-bytes", "image/jpeg")},
    )

    assert response.status_code == 401


async def test_practice_session_without_before_photo_has_null_url(
    client, session_factory, auth_headers
):
    response = await client.post("/practice-sessions", json=VALID_PAYLOAD, headers=auth_headers)

    assert response.status_code == 201
    assert response.json()["before_photo_url"] is None


async def test_practice_sessions_are_isolated_per_learner(client, session_factory, auth_headers):
    await client.post("/practice-sessions", json=VALID_PAYLOAD, headers=auth_headers)

    await client.post(
        "/learners/register", json={"email": "outro-aluno@example.com", "password": "senha1234"}
    )
    other_login = await client.post(
        "/learners/login", json={"email": "outro-aluno@example.com", "password": "senha1234"}
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    response = await client.get("/practice-sessions", headers=other_headers)

    assert response.status_code == 200
    assert response.json() == []
