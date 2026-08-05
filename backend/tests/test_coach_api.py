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
