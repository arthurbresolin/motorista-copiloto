from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CarCreate(BaseModel):
    brand_model: str
    plate: str | None = None
    transmission: str | None = None


class CarRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    brand_model: str
    plate: str | None
    transmission: str | None
    created_at: datetime
