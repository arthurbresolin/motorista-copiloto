from datetime import date

from pydantic import BaseModel, ConfigDict, Field, computed_field


class PracticeSessionCreate(BaseModel):
    practiced_at: date
    duration_minutes: int = Field(gt=0)
    distance_km: float = Field(ge=0)
    maneuvers: list[str] = []
    notes: str | None = None
    car_id: int | None = None
    # Só o Modo Copiloto manda True — ver o comentário no modelo.
    guided: bool = False


class PracticeSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    practiced_at: date
    duration_minutes: int
    distance_km: float
    maneuvers: list[str]
    notes: str | None
    car_id: int | None
    guided: bool = False
    before_photo_path: str | None = Field(exclude=True, default=None)

    @computed_field
    @property
    def before_photo_url(self) -> str | None:
        return f"/media/{self.before_photo_path}" if self.before_photo_path else None


class PracticeSessionStats(BaseModel):
    total_sessions: int
    total_minutes: int
    total_km: float
