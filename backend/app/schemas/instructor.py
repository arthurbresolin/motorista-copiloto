from pydantic import BaseModel, ConfigDict, Field

from app.schemas.checklist import ChecklistSessionRead
from app.schemas.monitor_session import MonitorSessionRead
from app.schemas.practice_session import PracticeSessionRead, PracticeSessionStats
from app.schemas.quiz import QuizSessionRead


class InstructorInviteRead(BaseModel):
    token: str


class InstructorInviteStatus(BaseModel):
    valid: bool


class InstructorRegister(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str | None = None


class InstructorLogin(BaseModel):
    email: str
    password: str


class InstructorAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class InstructorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str | None


class InstructorOverview(BaseModel):
    practice_sessions: list[PracticeSessionRead]
    checklist_sessions: list[ChecklistSessionRead]
    monitor_sessions: list[MonitorSessionRead]
    quiz_sessions: list[QuizSessionRead]
    practice_stats: PracticeSessionStats
