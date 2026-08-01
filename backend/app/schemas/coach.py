from pydantic import BaseModel, Field


class CoachFeedback(BaseModel):
    available: bool
    message: str | None = None


class PhotoFeedbackRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    media_type: str = "image/jpeg"
