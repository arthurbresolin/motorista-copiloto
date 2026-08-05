from app.models import ChecklistItem


async def _add_items(session_factory, titles):
    async with session_factory() as session:
        items = [ChecklistItem(title=title, order=order) for order, title in enumerate(titles, start=1)]
        session.add_all(items)
        await session.commit()
        for item in items:
            await session.refresh(item)
        return [item.id for item in items]


async def test_get_checklist_returns_items_in_order(client, session_factory):
    await _add_items(session_factory, ["Cinto", "Espelhos"])

    response = await client.get("/checklist")

    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == ["Cinto", "Espelhos"]


async def test_create_checklist_session_with_marked_items(client, session_factory, auth_headers):
    item_ids = await _add_items(session_factory, ["Cinto", "Espelhos"])

    response = await client.post(
        "/checklist/sessions", json={"item_ids": item_ids}, headers=auth_headers
    )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["executed_at"] is not None
    assert {item["title"] for item in body["items"]} == {"Cinto", "Espelhos"}


async def test_create_checklist_session_requires_auth(client, session_factory):
    item_ids = await _add_items(session_factory, ["Cinto"])

    response = await client.post("/checklist/sessions", json={"item_ids": item_ids})

    assert response.status_code == 401


async def test_create_checklist_session_rejects_unknown_item_id(client, session_factory, auth_headers):
    response = await client.post(
        "/checklist/sessions", json={"item_ids": [999]}, headers=auth_headers
    )

    assert response.status_code == 422


async def test_list_checklist_sessions_most_recent_first(client, session_factory, auth_headers):
    item_ids = await _add_items(session_factory, ["Cinto"])

    await client.post("/checklist/sessions", json={"item_ids": item_ids}, headers=auth_headers)
    second = await client.post(
        "/checklist/sessions", json={"item_ids": item_ids}, headers=auth_headers
    )

    response = await client.get("/checklist/sessions", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["id"] == second.json()["id"]
