from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChecklistItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    order: int


class ChecklistSessionCreate(BaseModel):
    item_ids: list[int] = []


class ChecklistSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    executed_at: datetime
    items: list[ChecklistItemRead]
