import secrets
import shutil
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import resend
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import MEDIA_DIR, settings
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import (
    Car,
    ChecklistSession,
    Instructor,
    InstructorInvite,
    Learner,
    MonitorSession,
    PasswordResetToken,
    PracticeSession,
    PracticeSessionFeedback,
    QuizSession,
)
from app.schemas.learner import (
    ChangePasswordRequest,
    LearnerAuthResponse,
    LearnerLogin,
    LearnerRead,
    LearnerRegister,
    LearnerUpdate,
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
)

router = APIRouter(prefix="/learners", tags=["learners"])

PASSWORD_RESET_TOKEN_TTL = timedelta(hours=1)


def _utc_now_naive() -> datetime:
    # SQLite não guarda timezone mesmo em colunas DateTime(timezone=True) —
    # volta do banco como naive. Comparar precisa ser naive dos dois lados,
    # senão dá TypeError (offset-naive vs offset-aware).
    return datetime.now(timezone.utc).replace(tzinfo=None)

bearer_scheme = HTTPBearer()

AVATAR_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


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


@router.patch("/me", response_model=LearnerRead)
async def update_learner_profile(
    payload: LearnerUpdate,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(learner, field, value)
    await db.commit()
    await db.refresh(learner)
    return learner


@router.post("/me/change-password", response_model=MessageResponse)
async def change_learner_password(
    payload: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    if not verify_password(payload.current_password, learner.password_hash):
        raise HTTPException(status_code=401, detail="senha atual incorreta")
    learner.password_hash = hash_password(payload.new_password)
    await db.commit()
    return MessageResponse(message="senha atualizada")


@router.post("/me/avatar", response_model=LearnerRead)
async def upload_learner_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    extension = AVATAR_CONTENT_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(status_code=422, detail="envie uma imagem jpeg, png ou webp")

    avatars_dir = MEDIA_DIR / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    # Remove o avatar antigo, se existir, pra não acumular arquivo órfão.
    if learner.avatar_url:
        (MEDIA_DIR / learner.avatar_url.removeprefix("/media/")).unlink(missing_ok=True)

    filename = f"{learner.id}-{uuid4().hex}{extension}"
    contents = await file.read()
    (avatars_dir / filename).write_bytes(contents)

    learner.avatar_url = f"/media/avatars/{filename}"
    await db.commit()
    await db.refresh(learner)
    return learner


@router.delete("/me", response_model=MessageResponse)
async def delete_learner_account(
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    practice_session_ids_result = await db.execute(
        select(PracticeSession.id).where(PracticeSession.learner_id == learner.id)
    )
    practice_session_ids = practice_session_ids_result.scalars().all()

    # Sessões de checklist têm relação N:N (checklist_session_items) — apaga
    # via ORM pra deixar o SQLAlchemy limpar a tabela de associação também,
    # em vez de um DELETE em massa que deixaria linhas órfãs lá.
    checklist_result = await db.execute(
        select(ChecklistSession).where(ChecklistSession.learner_id == learner.id)
    )
    for checklist_session in checklist_result.scalars().all():
        await db.delete(checklist_session)

    await db.execute(
        delete(PracticeSessionFeedback).where(PracticeSessionFeedback.learner_id == learner.id)
    )
    await db.execute(delete(QuizSession).where(QuizSession.learner_id == learner.id))
    await db.execute(delete(MonitorSession).where(MonitorSession.learner_id == learner.id))
    await db.execute(delete(PracticeSession).where(PracticeSession.learner_id == learner.id))
    await db.execute(delete(Car).where(Car.learner_id == learner.id))
    await db.execute(delete(Instructor).where(Instructor.learner_id == learner.id))
    await db.execute(delete(InstructorInvite).where(InstructorInvite.learner_id == learner.id))

    if learner.avatar_url:
        (MEDIA_DIR / learner.avatar_url.removeprefix("/media/")).unlink(missing_ok=True)
    for session_id in practice_session_ids:
        shutil.rmtree(MEDIA_DIR / "practice-sessions" / str(session_id), ignore_errors=True)

    await db.delete(learner)
    await db.commit()

    return MessageResponse(message="conta excluída")


@router.post("/password-reset/request", response_model=MessageResponse)
async def request_password_reset(
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
):
    # Sempre responde a mesma mensagem, exista ou não a conta — não revela
    # pra quem está pedindo se aquele e-mail tem cadastro.
    generic_response = MessageResponse(
        message="se esse e-mail tiver uma conta, você vai receber um link de redefinição"
    )

    result = await db.execute(select(Learner).where(Learner.email == payload.email))
    learner = result.scalar_one_or_none()
    if learner is None or not settings.resend_api_key or not settings.web_url:
        return generic_response

    now = _utc_now_naive()
    token = PasswordResetToken(
        learner_id=learner.id,
        token=secrets.token_hex(32),
        expires_at=now + PASSWORD_RESET_TOKEN_TTL,
    )
    db.add(token)
    await db.commit()

    resend.api_key = settings.resend_api_key
    reset_link = f"{settings.web_url}/redefinir-senha?token={token.token}"
    try:
        await resend.Emails.send_async(
            {
                "from": settings.email_from,
                "to": [learner.email],
                "subject": "Redefinir sua senha — Motorista Copiloto",
                "html": (
                    f"<p>Alguém (esperamos que você) pediu pra redefinir a senha da sua "
                    f"conta no Motorista Copiloto.</p>"
                    f'<p><a href="{reset_link}">Clique aqui pra escolher uma nova senha</a>. '
                    f"O link vale por 1 hora.</p>"
                    f"<p>Se não foi você, pode ignorar este e-mail.</p>"
                ),
            }
        )
    except resend.exceptions.ResendError:
        # E-mail é best-effort — o token já foi criado, então se o envio
        # falhar o usuário pode pedir de novo sem quebrar o endpoint.
        pass

    return generic_response


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def confirm_password_reset(
    payload: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == payload.token)
    )
    reset_token = result.scalar_one_or_none()

    now = _utc_now_naive()
    if (
        reset_token is None
        or reset_token.used_at is not None
        or reset_token.expires_at < now
    ):
        raise HTTPException(status_code=400, detail="token inválido ou expirado")

    learner = await db.get(Learner, reset_token.learner_id)
    if learner is None:
        raise HTTPException(status_code=400, detail="token inválido ou expirado")

    learner.password_hash = hash_password(payload.new_password)
    reset_token.used_at = now
    await db.commit()

    return MessageResponse(message="senha redefinida")
