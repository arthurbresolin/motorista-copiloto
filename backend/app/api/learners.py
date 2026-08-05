from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import Learner
from app.schemas.learner import LearnerAuthResponse, LearnerLogin, LearnerRead, LearnerRegister

router = APIRouter(prefix="/learners", tags=["learners"])

bearer_scheme = HTTPBearer()


async def get_current_learner(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Learner:
    learner_id = decode_access_token(credentials.credentials, expected_role="learner")
    if learner_id is None:
        raise HTTPException(status_code=401, detail="token inválido ou expirado")
    learner = await db.get(Learner, learner_id)
    if learner is None:
        raise HTTPException(status_code=401, detail="token inválido ou expirado")
    return learner


@router.post("/register", response_model=LearnerAuthResponse, status_code=201)
async def register_learner(payload: LearnerRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Learner).where(Learner.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="já existe uma conta com este e-mail")

    learner = Learner(
        email=payload.email, password_hash=hash_password(payload.password), name=payload.name
    )
    db.add(learner)
    await db.commit()
    await db.refresh(learner)

    return LearnerAuthResponse(access_token=create_access_token(learner.id, role="learner"))


@router.post("/login", response_model=LearnerAuthResponse)
async def login_learner(payload: LearnerLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Learner).where(Learner.email == payload.email))
    learner = result.scalar_one_or_none()
    if learner is None or not verify_password(payload.password, learner.password_hash):
        raise HTTPException(status_code=401, detail="e-mail ou senha inválidos")
    return LearnerAuthResponse(access_token=create_access_token(learner.id, role="learner"))


@router.get("/me", response_model=LearnerRead)
async def get_current_learner_profile(learner: Learner = Depends(get_current_learner)):
    return learner
