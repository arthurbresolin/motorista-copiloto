import base64
from uuid import uuid4

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.learners import get_current_learner
from app.core.config import MEDIA_DIR, settings
from app.db.session import get_db
from app.models import Learner, MonitorSession, PracticeSession, PracticeSessionFeedback
from app.schemas.coach import CoachFeedback, PhotoFeedbackRequest, PracticeSessionFeedbackRead

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

PHOTO_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

SYSTEM_PROMPT = (
    "Você é um instrutor de direção experiente e encorajador, dando feedback pra um "
    "aluno logo após uma sessão de prática guiada. Responda em português do Brasil, "
    "em no máximo 3 frases curtas, direto ao ponto, sem saudação nem se apresentar. "
    "Baseie-se apenas nos números fornecidos — não invente dados. Estruture a "
    "resposta em três partes bem enxutas: (1) o que os números mostram de bom ou "
    "de preocupante nesta sessão comparada com o histórico, citando um número "
    "concreto sempre que der; (2) uma explicação curta do porquê isso importa pra "
    "quem está aprendendo a dirigir (ex: por que reduzir movimentos bruscos "
    "importa, não só que reduziu); (3) uma sugestão específica e prática do que "
    "focar na próxima sessão — não um conselho genérico tipo 'continue praticando'. "
    "Se não houver dado suficiente pra comparar, comente só a sessão atual e ainda "
    "assim feche com uma sugestão concreta pra próxima vez."
)

PHOTO_SYSTEM_PROMPT = (
    "Você é um instrutor de direção experiente e encorajador, olhando uma foto do "
    "resultado de uma manobra de estacionamento que um aluno acabou de praticar. "
    "Responda em português do Brasil, em no máximo 3 frases curtas, sem saudação "
    "nem se apresentar. Estruture a resposta em três partes bem enxutas: (1) o que "
    "está bom ou ruim no alinhamento do carro e na distância dos veículos/meio-fio "
    "vizinhos, sendo específico sobre o que você vê na foto; (2) por que esse "
    "detalhe importa na prática (ex: risco de bater o retrovisor, dificuldade pra "
    "sair da vaga depois); (3) uma sugestão concreta do que ajustar na próxima "
    "tentativa. Se não der pra avaliar direito pela foto (ângulo ruim, muito "
    "longe, não dá pra ver um carro estacionado), diga isso em vez de inventar uma "
    "avaliação, e peça uma foto melhor."
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
async def get_practice_session_feedback(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    result = await db.execute(
        select(PracticeSession).where(
            PracticeSession.id == session_id, PracticeSession.learner_id == learner.id
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="sessão de prática não encontrada")

    if not settings.anthropic_api_key:
        return CoachFeedback(available=False)

    previous_result = await db.execute(
        select(PracticeSession)
        .where(PracticeSession.id != session_id, PracticeSession.learner_id == learner.id)
        .order_by(PracticeSession.practiced_at.desc(), PracticeSession.id.desc())
        .limit(TREND_SESSION_COUNT)
    )
    previous_sessions = list(previous_result.scalars().all())

    # Não existe vínculo direto entre prática e monitoramento (o app cria os
    # dois juntos no Modo Copiloto, mas são tabelas independentes), então
    # usamos as sessões de monitor mais recentes como aproximação da tendência.
    monitor_result = await db.execute(
        select(MonitorSession)
        .where(MonitorSession.learner_id == learner.id)
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

    message = text.strip()
    db.add(
        PracticeSessionFeedback(
            learner_id=learner.id, practice_session_id=session_id, kind="text", message=message
        )
    )
    await db.commit()

    return CoachFeedback(available=True, message=message)


@router.post("/practice-sessions/{session_id}/photo-feedback", response_model=CoachFeedback)
async def get_practice_session_photo_feedback(
    session_id: int,
    payload: PhotoFeedbackRequest,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    result = await db.execute(
        select(PracticeSession).where(
            PracticeSession.id == session_id, PracticeSession.learner_id == learner.id
        )
    )
    session = result.scalar_one_or_none()
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

    message = text.strip()

    extension = PHOTO_EXTENSIONS.get(payload.media_type, ".jpg")
    session_dir = MEDIA_DIR / "practice-sessions" / str(session_id)
    session_dir.mkdir(parents=True, exist_ok=True)
    photo_filename = f"{uuid4().hex}{extension}"
    (session_dir / photo_filename).write_bytes(image_bytes)
    photo_path = f"practice-sessions/{session_id}/{photo_filename}"

    db.add(
        PracticeSessionFeedback(
            learner_id=learner.id,
            practice_session_id=session_id,
            kind="photo",
            message=message,
            photo_path=photo_path,
        )
    )
    await db.commit()

    return CoachFeedback(available=True, message=message)


def _to_feedback_read(feedback: PracticeSessionFeedback) -> PracticeSessionFeedbackRead:
    return PracticeSessionFeedbackRead(
        id=feedback.id,
        practice_session_id=feedback.practice_session_id,
        kind=feedback.kind,
        message=feedback.message,
        photo_url=f"/media/{feedback.photo_path}" if feedback.photo_path else None,
        created_at=feedback.created_at,
    )


@router.get(
    "/practice-sessions/{session_id}/history", response_model=list[PracticeSessionFeedbackRead]
)
async def get_practice_session_feedback_history(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    session_result = await db.execute(
        select(PracticeSession.id).where(
            PracticeSession.id == session_id, PracticeSession.learner_id == learner.id
        )
    )
    if session_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="sessão de prática não encontrada")

    result = await db.execute(
        select(PracticeSessionFeedback)
        .where(
            PracticeSessionFeedback.practice_session_id == session_id,
            PracticeSessionFeedback.learner_id == learner.id,
        )
        .order_by(PracticeSessionFeedback.created_at.asc())
    )
    return [_to_feedback_read(feedback) for feedback in result.scalars().all()]


@router.get("/history", response_model=list[PracticeSessionFeedbackRead])
async def get_feedback_history(
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    result = await db.execute(
        select(PracticeSessionFeedback)
        .where(PracticeSessionFeedback.learner_id == learner.id)
        .order_by(PracticeSessionFeedback.created_at.desc())
    )
    return [_to_feedback_read(feedback) for feedback in result.scalars().all()]
