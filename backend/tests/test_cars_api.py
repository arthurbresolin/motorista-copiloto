VALID_PAYLOAD = {
    "brand_model": "Fiat Argo 2022",
    "plate": "ABC1D23",
    "transmission": "manual",
}


async def test_create_car(client, session_factory):
    response = await client.post("/cars", json=VALID_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["id"] is not None
    assert body["brand_model"] == "Fiat Argo 2022"
    assert body["plate"] == "ABC1D23"
    assert body["transmission"] == "manual"


async def test_create_car_allows_optional_fields_empty(client, session_factory):
    response = await client.post("/cars", json={"brand_model": "HB20"})

    assert response.status_code == 201
    body = response.json()
    assert body["plate"] is None
    assert body["transmission"] is None


async def test_create_car_rejects_missing_required_fields(client, session_factory):
    response = await client.post("/cars", json={"plate": "ABC1D23"})

    assert response.status_code == 422


async def test_list_cars_most_recent_first(client, session_factory):
    older = {**VALID_PAYLOAD, "brand_model": "Carro antigo"}
    newer = {**VALID_PAYLOAD, "brand_model": "Carro novo"}

    await client.post("/cars", json=older)
    await client.post("/cars", json=newer)

    response = await client.get("/cars")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["brand_model"] == "Carro novo"
    assert body[1]["brand_model"] == "Carro antigo"


async def test_get_car_by_id(client, session_factory):
    created = await client.post("/cars", json=VALID_PAYLOAD)
    car_id = created.json()["id"]

    response = await client.get(f"/cars/{car_id}")

    assert response.status_code == 200
    assert response.json()["id"] == car_id


async def test_get_car_by_id_not_found(client, session_factory):
    response = await client.get("/cars/999")

    assert response.status_code == 404
