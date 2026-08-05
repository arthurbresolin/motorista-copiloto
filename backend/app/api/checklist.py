from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.learners import get_current_learner
from app.db.session import get_db
from app.models import ChecklistItem, ChecklistSession, Learner
from app.schemas.checklist import ChecklistItemRead, ChecklistSessionCreate, ChecklistSessionRead

router = APIRouter(prefix="/checklist", tags=["checklist"])


@router.get("", response_model=list[ChecklistItemRead])
async def list_checklist_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChecklistItem).order_by(ChecklistItem.order))
    return result.scalars().all()


@router.post("/sessions", response_model=ChecklistSessionRead, status_code=201)
async def create_checklist_session(
    payload: ChecklistSessionCreate,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    items = []
    if payload.item_ids:
        result = await db.execute(
            select(ChecklistItem).where(ChecklistItem.id.in_(payload.item_ids))
        )
        items = result.scalars().all()
        if len(items) != len(set(payload.item_ids)):
            raise HTTPException(status_code=422, detail="um ou mais item_ids não existem")

    session = ChecklistSession(items=items, learner_id=learner.id)
    db.add(session)
    await db.commit()
    await db.refresh(session, attribute_names=["items"])
    return session


@router.get("/sessions", response_model=list[ChecklistSessionRead])
async def list_checklist_sessions(
    db: AsyncSession = Depends(get_db), learner: Learner = Depends(get_current_learner)
):
    result = await db.execute(
        select(ChecklistSession)
        .where(ChecklistSession.learner_id == learner.id)
        .order_by(ChecklistSession.executed_at.desc(), ChecklistSession.id.desc())
    )
    return result.scalars().all()
