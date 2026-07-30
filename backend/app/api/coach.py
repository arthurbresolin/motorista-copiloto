import anthropic
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models import MonitorSession, PracticeSession
from app.schemas.coach import CoachFeedback

router = APIRouter(prefix="/coach", tags=["coach"])

TREND_SESSION_COUNT = 5
MODEL = "claude-opus-4-8"

SYSTEM_PROMPT = (
    "Você é um instrutor de direção experiente e encorajador, dando feedback rápido "
    "para um aluno logo após uma sessão de prática guiada. Responda em português do "
    "Brasil, em 1 ou 2 frases curtas, direto ao ponto. Baseie-se apenas nos números "
    "fornecidos — não invente dados. Se a tendência estiver melhorando, celebre isso "
    "com um número concreto. Se não houver dado suficiente para comparar, apenas "
    "comente a sessão atual. Não use saudações nem se apresente."
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
