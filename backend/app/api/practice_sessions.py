from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import PracticeSession
from app.schemas.practice_session import PracticeSessionCreate, PracticeSessionRead

router = APIRouter(prefix="/practice-sessions", tags=["practice-sessions"])

MAX_LISTED_SESSIONS = 50


@router.post("", response_model=PracticeSessionRead, status_code=201)
async def create_practice_session(
    payload: PracticeSessionCreate, db: AsyncSession = Depends(get_db)
):
    session = PracticeSession(**payload.model_dump())
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=list[PracticeSessionRead])
async def list_practice_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PracticeSession)
        .order_by(PracticeSession.practiced_at.desc(), PracticeSession.id.desc())
        .limit(MAX_LISTED_SESSIONS)
    )
    return result.scalars().all()


@router.get("/{session_id}", response_model=PracticeSessionRead)
async def get_practice_session(session_id: int, db: AsyncSession = Depends(get_db)):
    session = await db.get(PracticeSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="sessão de prática não encontrada")
    return session
