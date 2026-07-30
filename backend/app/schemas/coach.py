from pydantic import BaseModel


class CoachFeedback(BaseModel):
    available: bool
    message: str | None = None
