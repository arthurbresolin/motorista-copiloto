from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.learners import get_current_learner
from app.db.session import get_db
from app.models import Learner, PracticeSession
from app.schemas.practice_session import (
    PracticeSessionCreate,
    PracticeSessionRead,
    PracticeSessionStats,
)

router = APIRouter(prefix="/practice-sessions", tags=["practice-sessions"])

MAX_LISTED_SESSIONS = 50


@router.post("", response_model=PracticeSessionRead, status_code=201)
async def create_practice_session(
    payload: PracticeSessionCreate,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    session = PracticeSession(**payload.model_dump(), learner_id=learner.id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=list[PracticeSessionRead])
async def list_practice_sessions(
    db: AsyncSession = Depends(get_db), learner: Learner = Depends(get_current_learner)
):
    result = await db.execute(
        select(PracticeSession)
        .where(PracticeSession.learner_id == learner.id)
        .order_by(PracticeSession.practiced_at.desc(), PracticeSession.id.desc())
        .limit(MAX_LISTED_SESSIONS)
    )
    return result.scalars().all()


@router.get("/stats", response_model=PracticeSessionStats)
async def get_practice_session_stats(
    db: AsyncSession = Depends(get_db), learner: Learner = Depends(get_current_learner)
):
    result = await db.execute(
        select(
            func.count(PracticeSession.id),
            func.coalesce(func.sum(PracticeSession.duration_minutes), 0),
            func.coalesce(func.sum(PracticeSession.distance_km), 0.0),
        ).where(PracticeSession.learner_id == learner.id)
    )
    total_sessions, total_minutes, total_km = result.one()
    return PracticeSessionStats(
        total_sessions=total_sessions, total_minutes=total_minutes, total_km=total_km
    )


@router.get("/{session_id}", response_model=PracticeSessionRead)
async def get_practice_session(
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
    return session
