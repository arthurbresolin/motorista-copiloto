from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import QuizQuestion, QuizSession
from app.schemas.quiz import QuizQuestionRead, QuizSessionCreate, QuizSessionRead

router = APIRouter(prefix="/quiz", tags=["quiz"])

MAX_LISTED_SESSIONS = 50


@router.get("/questions", response_model=list[QuizQuestionRead])
async def list_quiz_questions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(QuizQuestion).order_by(QuizQuestion.id))
    return result.scalars().all()


@router.post("/sessions", response_model=QuizSessionRead, status_code=201)
async def create_quiz_session(payload: QuizSessionCreate, db: AsyncSession = Depends(get_db)):
    question_ids = [answer.question_id for answer in payload.answers]
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.id.in_(question_ids)))
    questions_by_id = {question.id: question for question in result.scalars().all()}

    score = sum(
        1
        for answer in payload.answers
        if answer.question_id in questions_by_id
        and questions_by_id[answer.question_id].correct_index == answer.selected_index
    )

    session = QuizSession(score=score, total_questions=len(payload.answers))
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions", response_model=list[QuizSessionRead])
async def list_quiz_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(QuizSession)
        .order_by(QuizSession.completed_at.desc(), QuizSession.id.desc())
        .limit(MAX_LISTED_SESSIONS)
    )
    return result.scalars().all()
