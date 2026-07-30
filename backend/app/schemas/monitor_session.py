from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RoutePoint(BaseModel):
    lat: float
    lng: float
    harsh: bool = False


class MonitorSessionCreate(BaseModel):
    started_at: datetime
    duration_seconds: int = Field(ge=0)
    event_count: int = Field(ge=0)
    severe_event_count: int = Field(default=0, ge=0)
    route: list[RoutePoint] | None = None


class MonitorSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: datetime
    duration_seconds: int
    event_count: int
    severe_event_count: int
    route: list[RoutePoint] | None
