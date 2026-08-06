from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CoachFeedback(BaseModel):
    available: bool
    message: str | None = None


class PhotoFeedbackRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    media_type: str = "image/jpeg"


class PracticeSessionFeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    practice_session_id: int
    kind: str
    message: str
    photo_url: str | None
    created_at: datetime
