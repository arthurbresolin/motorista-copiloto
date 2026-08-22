from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.learners import get_current_learner
from app.db.session import get_db
from app.models import Learner, MonitorSession
from app.schemas.monitor_session import MonitorSessionCreate, MonitorSessionRead

router = APIRouter(prefix="/monitor-sessions", tags=["monitor-sessions"])

MAX_LISTED_SESSIONS = 50


@router.post("", response_model=MonitorSessionRead, status_code=201)
async def create_monitor_session(
    payload: MonitorSessionCreate,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    session = MonitorSession(**payload.model_dump(), learner_id=learner.id)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("", response_model=list[MonitorSessionRead])
async def list_monitor_sessions(
    db: AsyncSession = Depends(get_db), learner: Learner = Depends(get_current_learner)
):
    result = await db.execute(
        select(MonitorSession)
        .where(MonitorSession.learner_id == learner.id)
        .order_by(MonitorSession.started_at.desc(), MonitorSession.id.desc())
        .limit(MAX_LISTED_SESSIONS)
    )
    return result.scalars().all()


@router.get("/{session_id}", response_model=MonitorSessionRead)
async def get_monitor_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    result = await db.execute(
        select(MonitorSession).where(
            MonitorSession.id == session_id, MonitorSession.learner_id == learner.id
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="sessão de monitoramento não encontrada")
    return session
