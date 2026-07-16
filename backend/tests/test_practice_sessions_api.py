VALID_PAYLOAD = {
    "practiced_at": "2026-07-10",
    "duration_minutes": 45,
    "distance_km": 12.5,
    "maneuvers": ["baliza", "rotatória"],
    "notes": "foi bem em geral",
}


async def test_create_practice_session(client, session_factory):
    response = await client.post("/practice-sessions", json=VALID_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["practiced_at"] == "2026-07-10"
    assert body["duration_minutes"] == 45
    assert body["distance_km"] == 12.5
    assert body["maneuvers"] == ["baliza", "rotatória"]
    assert body["notes"] == "foi bem em geral"


async def test_create_practice_session_rejects_missing_required_fields(client, session_factory):
    response = await client.post("/practice-sessions", json={"practiced_at": "2026-07-10"})

    assert response.status_code == 422


async def test_create_practice_session_rejects_non_positive_numbers(client, session_factory):
    payload = {**VALID_PAYLOAD, "duration_minutes": 0}

    response = await client.post("/practice-sessions", json=payload)

    assert response.status_code == 422


async def test_list_practice_sessions_most_recent_first(client, session_factory):
    older = {**VALID_PAYLOAD, "practiced_at": "2026-07-01"}
    newer = {**VALID_PAYLOAD, "practiced_at": "2026-07-10"}

    await client.post("/practice-sessions", json=older)
    await client.post("/practice-sessions", json=newer)

    response = await client.get("/practice-sessions")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["practiced_at"] == "2026-07-10"
    assert body[1]["practiced_at"] == "2026-07-01"


async def test_get_practice_session_by_id(client, session_factory):
    created = await client.post("/practice-sessions", json=VALID_PAYLOAD)
    session_id = created.json()["id"]

    response = await client.get(f"/practice-sessions/{session_id}")

    assert response.status_code == 200
    assert response.json()["id"] == session_id


async def test_get_practice_session_by_id_not_found(client, session_factory):
    response = await client.get("/practice-sessions/999")

    assert response.status_code == 404


async def test_create_practice_session_with_car(client, session_factory):
    car = await client.post("/cars", json={"brand_model": "Fiat Argo 2022"})
    car_id = car.json()["id"]

    response = await client.post("/practice-sessions", json={**VALID_PAYLOAD, "car_id": car_id})

    assert response.status_code == 201
    assert response.json()["car_id"] == car_id


async def test_create_practice_session_without_car(client, session_factory):
    response = await client.post("/practice-sessions", json=VALID_PAYLOAD)

    assert response.status_code == 201
    assert response.json()["car_id"] is None
