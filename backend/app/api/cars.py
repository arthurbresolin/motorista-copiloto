from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.learners import get_current_learner
from app.db.session import get_db
from app.models import Car, Learner
from app.schemas.car import CarCreate, CarRead

router = APIRouter(prefix="/cars", tags=["cars"])

MAX_LISTED_CARS = 50


@router.post("", response_model=CarRead, status_code=201)
async def create_car(
    payload: CarCreate,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    car = Car(**payload.model_dump(), learner_id=learner.id)
    db.add(car)
    await db.commit()
    await db.refresh(car)
    return car


@router.get("", response_model=list[CarRead])
async def list_cars(
    db: AsyncSession = Depends(get_db), learner: Learner = Depends(get_current_learner)
):
    result = await db.execute(
        select(Car)
        .where(Car.learner_id == learner.id)
        .order_by(Car.created_at.desc(), Car.id.desc())
        .limit(MAX_LISTED_CARS)
    )
    return result.scalars().all()


@router.get("/{car_id}", response_model=CarRead)
async def get_car(
    car_id: int,
    db: AsyncSession = Depends(get_db),
    learner: Learner = Depends(get_current_learner),
):
    result = await db.execute(
        select(Car).where(Car.id == car_id, Car.learner_id == learner.id)
    )
    car = result.scalar_one_or_none()
    if car is None:
        raise HTTPException(status_code=404, detail="carro não encontrado")
    return car
