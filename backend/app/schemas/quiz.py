from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuizQuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    options: list[str]
    category: str | None


class QuizAnswer(BaseModel):
    question_id: int
    selected_index: int


class QuizSessionCreate(BaseModel):
    answers: list[QuizAnswer]


class QuizSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    completed_at: datetime
    score: int
    total_questions: int
