from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.learners import get_current_learner
from app.core.config import MEDIA_DIR
from app.db.session import get_db
from app.models import Learner, PracticeSession
from app.schemas.practice_session import (
    PracticeSessionCreate,
    PracticeSessionRead,
    PracticeSessionStats,
)

router = APIRouter(prefix="/practice-sessions", tags=["practice-sessions"])

MAX_LISTED_SESSIONS = 50

BEFORE_PHOTO_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


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


@router.post("/{session_id}/before-photo", response_model=PracticeSessionRead)
async def upload_practice_session_before_photo(
    session_id: int,
    file: UploadFile = File(...),
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

    extension = BEFORE_PHOTO_CONTENT_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(status_code=422, detail="envie uma imagem jpeg, png ou webp")

    session_dir = MEDIA_DIR / "practice-sessions" / str(session_id)
    session_dir.mkdir(parents=True, exist_ok=True)

    if session.before_photo_path:
        (MEDIA_DIR / session.before_photo_path).unlink(missing_ok=True)

    filename = f"before-{uuid4().hex}{extension}"
    contents = await file.read()
    (session_dir / filename).write_bytes(contents)

    session.before_photo_path = f"practice-sessions/{session_id}/{filename}"
    await db.commit()
    await db.refresh(session)
    return session
