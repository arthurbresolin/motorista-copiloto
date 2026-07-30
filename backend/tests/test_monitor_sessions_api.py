VALID_PAYLOAD = {
    "started_at": "2026-07-10T08:30:00Z",
    "duration_seconds": 900,
    "event_count": 3,
}


async def test_create_monitor_session(client, session_factory):
    response = await client.post("/monitor-sessions", json=VALID_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["duration_seconds"] == 900
    assert body["event_count"] == 3


async def test_create_monitor_session_rejects_missing_required_fields(client, session_factory):
    response = await client.post("/monitor-sessions", json={"started_at": "2026-07-10T08:30:00Z"})

    assert response.status_code == 422


async def test_create_monitor_session_rejects_negative_numbers(client, session_factory):
    payload = {**VALID_PAYLOAD, "event_count": -1}

    response = await client.post("/monitor-sessions", json=payload)

    assert response.status_code == 422


async def test_create_monitor_session_allows_zero_events(client, session_factory):
    payload = {**VALID_PAYLOAD, "event_count": 0}

    response = await client.post("/monitor-sessions", json=payload)

    assert response.status_code == 201
    assert response.json()["event_count"] == 0


async def test_list_monitor_sessions_most_recent_first(client, session_factory):
    older = {**VALID_PAYLOAD, "started_at": "2026-07-01T08:00:00Z"}
    newer = {**VALID_PAYLOAD, "started_at": "2026-07-10T08:00:00Z"}

    await client.post("/monitor-sessions", json=older)
    await client.post("/monitor-sessions", json=newer)

    response = await client.get("/monitor-sessions")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["started_at"].startswith("2026-07-10")
    assert body[1]["started_at"].startswith("2026-07-01")


async def test_get_monitor_session_by_id(client, session_factory):
    created = await client.post("/monitor-sessions", json=VALID_PAYLOAD)
    session_id = created.json()["id"]

    response = await client.get(f"/monitor-sessions/{session_id}")

    assert response.status_code == 200
    assert response.json()["id"] == session_id


async def test_get_monitor_session_by_id_not_found(client, session_factory):
    response = await client.get("/monitor-sessions/999")

    assert response.status_code == 404


async def test_create_monitor_session_with_route(client, session_factory):
    route = [
        {"lat": -23.55, "lng": -46.63, "harsh": False},
        {"lat": -23.551, "lng": -46.631, "harsh": True},
    ]

    response = await client.post("/monitor-sessions", json={**VALID_PAYLOAD, "route": route})

    assert response.status_code == 201
    body = response.json()
    assert body["route"] == route


async def test_create_monitor_session_without_route(client, session_factory):
    response = await client.post("/monitor-sessions", json=VALID_PAYLOAD)

    assert response.status_code == 201
    assert response.json()["route"] is None


async def test_create_monitor_session_defaults_severe_event_count_to_zero(client, session_factory):
    response = await client.post("/monitor-sessions", json=VALID_PAYLOAD)

    assert response.status_code == 201
    assert response.json()["severe_event_count"] == 0


async def test_create_monitor_session_with_severe_event_count(client, session_factory):
    payload = {**VALID_PAYLOAD, "event_count": 5, "severe_event_count": 2}

    response = await client.post("/monitor-sessions", json=payload)

    assert response.status_code == 201
    assert response.json()["severe_event_count"] == 2


async def test_create_monitor_session_rejects_negative_severe_event_count(client, session_factory):
    payload = {**VALID_PAYLOAD, "severe_event_count": -1}

    response = await client.post("/monitor-sessions", json=payload)

    assert response.status_code == 422
