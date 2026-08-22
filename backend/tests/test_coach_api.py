import anthropic
import httpx
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types

from app.core.config import settings

PRACTICE_PAYLOAD = {
    "practiced_at": "2026-07-10",
    "duration_minutes": 20,
    "distance_km": 5.0,
    "maneuvers": ["baliza"],
    "notes": "Registrado via Modo Copiloto",
}


class FakeTextBlock:
    type = "text"

    def __init__(self, text):
        self.text = text


class FakeMessage:
    def __init__(self, text, stop_reason="end_turn"):
        self.content = [FakeTextBlock(text)]
        self.stop_reason = stop_reason


class FakeCandidate:
    def __init__(self, finish_reason):
        self.finish_reason = finish_reason


class FakeGeminiResponse:
    def __init__(self, text, finish_reason=genai_types.FinishReason.STOP):
        self.text = text
        self.candidates = [FakeCandidate(finish_reason)]


class FakeGeminiModels:
    def __init__(self, response):
        self._response = response

    def generate_content(self, **kwargs):
        return self._response


def patch_genai_client(monkeypatch, response):
    monkeypatch.setattr(genai.Client, "__init__", lambda self, **kwargs: None)
    monkeypatch.setattr(genai.Client, "models", property(lambda self: FakeGeminiModels(response)))


async def test_feedback_not_found(client, session_factory, auth_headers):
    response = await client.get("/coach/practice-sessions/999/feedback", headers=auth_headers)

    assert response.status_code == 404


async def test_feedback_requires_auth(client, session_factory):
    response = await client.get("/coach/practice-sessions/999/feedback")

    assert response.status_code == 401


async def test_feedback_unavailable_without_api_key(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "anthropic_api_key", None)
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.get(f"/coach/practice-sessions/{session_id}/feedback", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"available": False, "message": None}


async def test_feedback_available_with_api_key(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "anthropic_api_key", "fake-key")
    monkeypatch.setattr(
        anthropic.Anthropic,
        "__init__",
        lambda self, **kwargs: None,
    )
    monkeypatch.setattr(
        anthropic.resources.Messages,
        "create",
        lambda self, **kwargs: FakeMessage("Mandou bem na baliza, continue assim!"),
    )
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.get(f"/coach/practice-sessions/{session_id}/feedback", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["available"] is True
    assert body["message"] == "Mandou bem na baliza, continue assim!"


async def test_feedback_unavailable_on_refusal(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "anthropic_api_key", "fake-key")
    monkeypatch.setattr(anthropic.Anthropic, "__init__", lambda self, **kwargs: None)
    monkeypatch.setattr(
        anthropic.resources.Messages,
        "create",
        lambda self, **kwargs: FakeMessage("", stop_reason="refusal"),
    )
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.get(f"/coach/practice-sessions/{session_id}/feedback", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"available": False, "message": None}


async def test_feedback_unavailable_on_api_error(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "anthropic_api_key", "fake-key")
    monkeypatch.setattr(anthropic.Anthropic, "__init__", lambda self, **kwargs: None)

    def raise_connection_error(self, **kwargs):
        raise anthropic.APIConnectionError(request=httpx.Request("POST", "https://api.anthropic.com"))

    monkeypatch.setattr(anthropic.resources.Messages, "create", raise_connection_error)
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.get(f"/coach/practice-sessions/{session_id}/feedback", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"available": False, "message": None}


PHOTO_PAYLOAD = {"image_base64": "ZmFrZS1pbWFnZS1kYXRh", "media_type": "image/jpeg"}


async def test_photo_feedback_not_found(client, session_factory, auth_headers):
    response = await client.post(
        "/coach/practice-sessions/999/photo-feedback", json=PHOTO_PAYLOAD, headers=auth_headers
    )

    assert response.status_code == 404


async def test_photo_feedback_requires_auth(client, session_factory):
    response = await client.post(
        "/coach/practice-sessions/999/photo-feedback", json=PHOTO_PAYLOAD
    )

    assert response.status_code == 401


async def test_photo_feedback_requires_image(client, session_factory, auth_headers):
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/coach/practice-sessions/{session_id}/photo-feedback",
        json={"image_base64": ""},
        headers=auth_headers,
    )

    assert response.status_code == 422


async def test_photo_feedback_unavailable_without_api_key(
    client, session_factory, monkeypatch, auth_headers
):
    monkeypatch.setattr(settings, "google_api_key", None)
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/coach/practice-sessions/{session_id}/photo-feedback",
        json=PHOTO_PAYLOAD,
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == {"available": False, "message": None}


async def test_photo_feedback_available_with_api_key(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "google_api_key", "fake-key")
    patch_genai_client(
        monkeypatch,
        FakeGeminiResponse("Carro bem alinhado, só ficou um pouco longe do meio-fio."),
    )
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/coach/practice-sessions/{session_id}/photo-feedback",
        json=PHOTO_PAYLOAD,
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["available"] is True
    assert "alinhado" in body["message"]


async def test_photo_feedback_unavailable_on_safety_block(
    client, session_factory, monkeypatch, auth_headers
):
    monkeypatch.setattr(settings, "google_api_key", "fake-key")
    patch_genai_client(
        monkeypatch, FakeGeminiResponse(None, finish_reason=genai_types.FinishReason.SAFETY)
    )
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/coach/practice-sessions/{session_id}/photo-feedback",
        json=PHOTO_PAYLOAD,
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == {"available": False, "message": None}


async def test_photo_feedback_unavailable_on_api_error(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "google_api_key", "fake-key")

    class RaisingModels:
        def generate_content(self, **kwargs):
            raise genai_errors.APIError(503, {"error": {"message": "overloaded"}})

    monkeypatch.setattr(genai.Client, "__init__", lambda self, **kwargs: None)
    monkeypatch.setattr(genai.Client, "models", property(lambda self: RaisingModels()))

    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/coach/practice-sessions/{session_id}/photo-feedback",
        json=PHOTO_PAYLOAD,
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == {"available": False, "message": None}


async def test_feedback_persists_to_history(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "anthropic_api_key", "fake-key")
    monkeypatch.setattr(anthropic.Anthropic, "__init__", lambda self, **kwargs: None)
    monkeypatch.setattr(
        anthropic.resources.Messages,
        "create",
        lambda self, **kwargs: FakeMessage("Mandou bem na baliza, continue assim!"),
    )
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    await client.get(f"/coach/practice-sessions/{session_id}/feedback", headers=auth_headers)

    from sqlalchemy import select as sa_select

    from app.models import PracticeSessionFeedback

    async with session_factory() as session:
        rows = (await session.execute(sa_select(PracticeSessionFeedback))).scalars().all()

    assert len(rows) == 1
    assert rows[0].kind == "text"
    assert rows[0].practice_session_id == session_id
    assert rows[0].message == "Mandou bem na baliza, continue assim!"
    assert rows[0].photo_path is None


async def test_feedback_unavailable_does_not_persist(client, session_factory, monkeypatch, auth_headers):
    monkeypatch.setattr(settings, "anthropic_api_key", None)
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    await client.get(f"/coach/practice-sessions/{session_id}/feedback", headers=auth_headers)

    from sqlalchemy import select as sa_select

    from app.models import PracticeSessionFeedback

    async with session_factory() as session:
        rows = (await session.execute(sa_select(PracticeSessionFeedback))).scalars().all()

    assert rows == []


async def test_photo_feedback_persists_to_history(
    client, session_factory, monkeypatch, auth_headers, isolated_media_dir
):
    monkeypatch.setattr(settings, "google_api_key", "fake-key")
    patch_genai_client(
        monkeypatch,
        FakeGeminiResponse("Carro bem alinhado, só ficou um pouco longe do meio-fio."),
    )
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    await client.post(
        f"/coach/practice-sessions/{session_id}/photo-feedback",
        json=PHOTO_PAYLOAD,
        headers=auth_headers,
    )

    from sqlalchemy import select as sa_select

    from app.models import PracticeSessionFeedback

    async with session_factory() as session:
        rows = (await session.execute(sa_select(PracticeSessionFeedback))).scalars().all()

    assert len(rows) == 1
    assert rows[0].kind == "photo"
    assert rows[0].photo_path is not None
    # Pasta temporária do teste, não o media/ do projeto — o arquivo some
    # sozinho no fim, sem precisar apagar na mão.
    assert (isolated_media_dir / rows[0].photo_path).is_file()


async def test_practice_session_feedback_history_requires_auth(client, session_factory):
    response = await client.get("/coach/practice-sessions/1/history")

    assert response.status_code == 401


async def test_practice_session_feedback_history_not_found(client, session_factory, auth_headers):
    response = await client.get("/coach/practice-sessions/999/history", headers=auth_headers)

    assert response.status_code == 404


async def test_practice_session_feedback_history_returns_entries(
    client, session_factory, monkeypatch, auth_headers
):
    monkeypatch.setattr(settings, "anthropic_api_key", "fake-key")
    monkeypatch.setattr(anthropic.Anthropic, "__init__", lambda self, **kwargs: None)
    monkeypatch.setattr(
        anthropic.resources.Messages, "create", lambda self, **kwargs: FakeMessage("Boa sessão!")
    )
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]
    await client.get(f"/coach/practice-sessions/{session_id}/feedback", headers=auth_headers)

    response = await client.get(
        f"/coach/practice-sessions/{session_id}/history", headers=auth_headers
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["kind"] == "text"
    assert body[0]["message"] == "Boa sessão!"
    assert body[0]["photo_url"] is None


async def test_feedback_history_requires_auth(client, session_factory):
    response = await client.get("/coach/history")

    assert response.status_code == 401


async def test_feedback_history_scoped_to_learner(client, session_factory, monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "fake-key")
    monkeypatch.setattr(anthropic.Anthropic, "__init__", lambda self, **kwargs: None)
    monkeypatch.setattr(
        anthropic.resources.Messages, "create", lambda self, **kwargs: FakeMessage("Boa sessão!")
    )

    await client.post("/learners/register", json={"email": "a1@example.com", "password": "senha1234"})
    login1 = await client.post(
        "/learners/login", json={"email": "a1@example.com", "password": "senha1234"}
    )
    headers1 = {"Authorization": f"Bearer {login1.json()['access_token']}"}
    created1 = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=headers1)
    session1_id = created1.json()["id"]
    await client.get(f"/coach/practice-sessions/{session1_id}/feedback", headers=headers1)

    await client.post("/learners/register", json={"email": "a2@example.com", "password": "senha1234"})
    login2 = await client.post(
        "/learners/login", json={"email": "a2@example.com", "password": "senha1234"}
    )
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}
    created2 = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=headers2)
    session2_id = created2.json()["id"]
    await client.get(f"/coach/practice-sessions/{session2_id}/feedback", headers=headers2)

    response1 = await client.get("/coach/history", headers=headers1)
    response2 = await client.get("/coach/history", headers=headers2)

    assert len(response1.json()) == 1
    assert len(response2.json()) == 1
    assert response1.json()[0]["practice_session_id"] == session1_id
    assert response2.json()[0]["practice_session_id"] == session2_id


async def test_photo_feedback_unavailable_on_invalid_base64(
    client, session_factory, monkeypatch, auth_headers
):
    monkeypatch.setattr(settings, "google_api_key", "fake-key")
    created = await client.post("/practice-sessions", json=PRACTICE_PAYLOAD, headers=auth_headers)
    session_id = created.json()["id"]

    response = await client.post(
        f"/coach/practice-sessions/{session_id}/photo-feedback",
        json={"image_base64": "not-valid-base64!!!", "media_type": "image/jpeg"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() == {"available": False, "message": None}
