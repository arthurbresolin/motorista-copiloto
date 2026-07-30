import secrets

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func as sql_func

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import ChecklistSession, Instructor, InstructorInvite, MonitorSession, PracticeSession, QuizSession
from app.schemas.instructor import (
    InstructorAuthResponse,
    InstructorInviteRead,
    InstructorInviteStatus,
    InstructorLogin,
    InstructorOverview,
    InstructorRead,
    InstructorRegister,
)
from app.schemas.practice_session import PracticeSessionStats

router = APIRouter(prefix="/instructors", tags=["instructors"])

bearer_scheme = HTTPBearer()


async def get_current_instructor(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Instructor:
    instructor_id = decode_access_token(credentials.credentials)
    if instructor_id is None:
        raise HTTPException(status_code=401, detail="token inválido ou expirado")
    instructor = await db.get(Instructor, instructor_id)
    if instructor is None:
        raise HTTPException(status_code=401, detail="token inválido ou expirado")
    return instructor


@router.post("/invites", response_model=InstructorInviteRead, status_code=201)
async def create_instructor_invite(db: AsyncSession = Depends(get_db)):
    invite = InstructorInvite(token=secrets.token_urlsafe(24))
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return InstructorInviteRead(token=invite.token)


@router.get("/invites/{token}", response_model=InstructorInviteStatus)
async def get_instructor_invite_status(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InstructorInvite).where(InstructorInvite.token == token))
    invite = result.scalar_one_or_none()
    return InstructorInviteStatus(valid=invite is not None and invite.used_at is None)


@router.post("/invites/{token}/accept", response_model=InstructorAuthResponse, status_code=201)
async def accept_instructor_invite(
    token: str, payload: InstructorRegister, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(InstructorInvite).where(InstructorInvite.token == token))
    invite = result.scalar_one_or_none()
    if invite is None or invite.used_at is not None:
        raise HTTPException(status_code=404, detail="convite inválido ou já utilizado")

    existing = await db.execute(select(Instructor).where(Instructor.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="já existe uma conta com este e-mail")

    instructor = Instructor(
        email=payload.email, password_hash=hash_password(payload.password), name=payload.name
    )
    db.add(instructor)
    invite.used_at = sql_func.now()
    await db.commit()
    await db.refresh(instructor)

    return InstructorAuthResponse(access_token=create_access_token(instructor.id))


@router.post("/login", response_model=InstructorAuthResponse)
async def login_instructor(payload: InstructorLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Instructor).where(Instructor.email == payload.email))
    instructor = result.scalar_one_or_none()
    if instructor is None or not verify_password(payload.password, instructor.password_hash):
        raise HTTPException(status_code=401, detail="e-mail ou senha inválidos")
    return InstructorAuthResponse(access_token=create_access_token(instructor.id))


@router.get("/me", response_model=InstructorRead)
async def get_current_instructor_profile(instructor: Instructor = Depends(get_current_instructor)):
    return instructor


@router.get("/overview", response_model=InstructorOverview)
async def get_instructor_overview(
    instructor: Instructor = Depends(get_current_instructor), db: AsyncSession = Depends(get_db)
):
    practice_result = await db.execute(
        select(PracticeSession).order_by(PracticeSession.practiced_at.desc(), PracticeSession.id.desc())
    )
    checklist_result = await db.execute(
        select(ChecklistSession).order_by(ChecklistSession.executed_at.desc(), ChecklistSession.id.desc())
    )
    monitor_result = await db.execute(
        select(MonitorSession).order_by(MonitorSession.started_at.desc(), MonitorSession.id.desc())
    )
    quiz_result = await db.execute(
        select(QuizSession).order_by(QuizSession.completed_at.desc(), QuizSession.id.desc())
    )
    stats_result = await db.execute(
        select(
            func.count(PracticeSession.id),
            func.coalesce(func.sum(PracticeSession.duration_minutes), 0),
            func.coalesce(func.sum(PracticeSession.distance_km), 0.0),
        )
    )
    total_sessions, total_minutes, total_km = stats_result.one()

    return InstructorOverview(
        practice_sessions=list(practice_result.scalars().all()),
        checklist_sessions=list(checklist_result.scalars().all()),
        monitor_sessions=list(monitor_result.scalars().all()),
        quiz_sessions=list(quiz_result.scalars().all()),
        practice_stats=PracticeSessionStats(
            total_sessions=total_sessions, total_minutes=total_minutes, total_km=total_km
        ),
    )
