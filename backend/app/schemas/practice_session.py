from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class PracticeSessionCreate(BaseModel):
    practiced_at: date
    duration_minutes: int = Field(gt=0)
    distance_km: float = Field(gt=0)
    maneuvers: list[str] = []
    notes: str | None = None


class PracticeSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    practiced_at: date
    duration_minutes: int
    distance_km: float
    maneuvers: list[str]
    notes: str | None
