import base64

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models import MonitorSession, PracticeSession
from app.schemas.coach import CoachFeedback, PhotoFeedbackRequest

router = APIRouter(prefix="/coach", tags=["coach"])

TREND_SESSION_COUNT = 5
MODEL = "claude-opus-4-8"
# Gemini tem camada gratuita (Anthropic não) — usado só pra análise de foto,
# que é o recurso que precisa rodar sem custo. "gemini-flash-latest" é um
# alias mantido pelo Google que sempre aponta pro modelo flash atual —
# evita fixar uma versão datada que vira obsoleta e passa a dar 404
# ("no longer available") depois de um tempo, como aconteceu com
# "gemini-2.5-flash" ao testar.
PHOTO_MODEL = "gemini-flash-latest"

SYSTEM_PROMPT = (
    "Você é um instrutor de direção experiente e encorajador, dando feedback rápido "
    "para um aluno logo após uma sessão de prática guiada. Responda em português do "
    "Brasil, em 1 ou 2 frases curtas, direto ao ponto. Baseie-se apenas nos números "
    "fornecidos — não invente dados. Se a tendência estiver melhorando, celebre isso "
    "com um número concreto. Se não houver dado suficiente para comparar, apenas "
    "comente a sessão atual. Não use saudações nem se apresente."
)

PHOTO_SYSTEM_PROMPT = (
    "Você é um instrutor de direção experiente e encorajador, olhando uma foto do "
    "resultado de uma manobra de estacionamento que um aluno acabou de praticar. "
    "Responda em português do Brasil, em 1 ou 2 frases curtas. Comente o alinhamento "
    "do carro, a distância dos veículos ou meio-fio vizinhos, e qualquer coisa que "
    "valha a pena ajustar da próxima vez. Se não der pra avaliar direito pela foto "
    "(ângulo ruim, muito longe, não é possível ver um carro estacionado), diga isso "
    "em vez de inventar uma avaliação. Não use saudações nem se apresente."
)


def _build_prompt(
    session: PracticeSession,
    previous_sessions: list[PracticeSession],
    recent_monitor_sessions: list[MonitorSession],
) -> str:
    lines = [
        "Sessão atual:",
        f"- duração: {session.duration_minutes} min",
        f"- distância: {session.distance_km} km",
        f"- manobras: {', '.join(session.maneuvers) or 'nenhuma registrada'}",
    ]

    if recent_monitor_sessions:
        latest_events = recent_monitor_sessions[0].event_count
        lines.append(f"- movimentos bruscos na sessão mais recente monitorada: {latest_events}")
        if len(recent_monitor_sessions) > 1:
            older_avg = sum(s.event_count for s in recent_monitor_sessions[1:]) / (
                len(recent_monitor_sessions) - 1
            )
            lines.append(f"- média de movimentos bruscos nas sessões monitoradas anteriores: {older_avg:.1f}")

    if previous_sessions:
        avg_minutes = sum(s.duration_minutes for s in previous_sessions) / len(previous_sessions)
        lines.append(f"- total de sessões anteriores: {len(previous_sessions)}")
        lines.append(f"- duração média das sessões anteriores: {avg_minutes:.0f} min")
    else:
        lines.append("- esta é a primeira sessão registrada do aluno")

    return "\n".join(lines)


@router.get("/practice-sessions/{session_id}/feedback", response_model=CoachFeedback)
async def get_practice_session_feedback(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(PracticeSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="sessão de prática não encontrada")

    if not settings.anthropic_api_key:
        return CoachFeedback(available=False)

    previous_result = await db.execute(
        select(PracticeSession)
        .where(PracticeSession.id != session_id)
        .order_by(PracticeSession.practiced_at.desc(), PracticeSession.id.desc())
        .limit(TREND_SESSION_COUNT)
    )
    previous_sessions = list(previous_result.scalars().all())

    # Não existe vínculo direto entre prática e monitoramento (o app cria os
    # dois juntos no Modo Copiloto, mas são tabelas independentes), então
    # usamos as sessões de monitor mais recentes como aproximação da tendência.
    monitor_result = await db.execute(
        select(MonitorSession)
        .order_by(MonitorSession.started_at.desc())
        .limit(TREND_SESSION_COUNT)
    )
    recent_monitor_sessions = list(monitor_result.scalars().all())

    prompt = _build_prompt(session, previous_sessions, recent_monitor_sessions)

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIError:
        return CoachFeedback(available=False)

    if response.stop_reason == "refusal":
        return CoachFeedback(available=False)

    text = next((block.text for block in response.content if block.type == "text"), None)
    if not text:
        return CoachFeedback(available=False)

    return CoachFeedback(available=True, message=text.strip())


@router.post("/practice-sessions/{session_id}/photo-feedback", response_model=CoachFeedback)
async def get_practice_session_photo_feedback(
    session_id: int, payload: PhotoFeedbackRequest, db: AsyncSession = Depends(get_db)
):
    session = await db.get(PracticeSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="sessão de prática não encontrada")

    if not settings.google_api_key:
        return CoachFeedback(available=False)

    maneuver = ", ".join(session.maneuvers) if session.maneuvers else "estacionamento"
    prompt_text = f"Manobra praticada: {maneuver}. Avalie o resultado nesta foto."

    try:
        image_bytes = base64.b64decode(payload.image_base64)
    except (ValueError, base64.binascii.Error):
        return CoachFeedback(available=False)

    client = genai.Client(api_key=settings.google_api_key)
    try:
        response = client.models.generate_content(
            model=PHOTO_MODEL,
            contents=[
                genai_types.Part.from_bytes(data=image_bytes, mime_type=payload.media_type),
                prompt_text,
            ],
            config=genai_types.GenerateContentConfig(
                system_instruction=PHOTO_SYSTEM_PROMPT,
                # gemini-flash-latest gasta uma parte do orçamento de tokens
                # "pensando" antes de responder (visto na prática: ~500 tokens
                # de thinking para uma resposta de ~35 tokens) — um limite
                # baixo cortava a resposta no meio da frase antes de terminar.
                max_output_tokens=1024,
            ),
        )
    except genai_errors.APIError:
        return CoachFeedback(available=False)

    candidate = response.candidates[0] if response.candidates else None
    if candidate is not None and candidate.finish_reason not in (
        genai_types.FinishReason.STOP,
        genai_types.FinishReason.MAX_TOKENS,
    ):
        return CoachFeedback(available=False)

    text = response.text
    if not text:
        return CoachFeedback(available=False)

    return CoachFeedback(available=True, message=text.strip())
