from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MonitorSessionCreate(BaseModel):
    started_at: datetime
    duration_seconds: int = Field(ge=0)
    event_count: int = Field(ge=0)


class MonitorSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: datetime
    duration_seconds: int
    event_count: int
