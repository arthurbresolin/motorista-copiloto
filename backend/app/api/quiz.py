from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import QuizQuestion, QuizSession
from app.schemas.quiz import QuizPhaseRead, QuizQuestionRead, QuizSessionCreate, QuizSessionRead

router = APIRouter(prefix="/quiz", tags=["quiz"])

MAX_LISTED_SESSIONS = 50
QUIZ_PASS_THRESHOLD = 0.7

# Ordem oficial das fases do quiz — as chaves batem com SKILLS (src/constants/skills.ts),
# exceto "geral" (perguntas sem categoria no banco), que é sempre a primeira fase.
QUIZ_PHASE_ORDER: list[tuple[str, str]] = [
    ("geral", "Legislação geral"),
    ("checklist", "Checklist"),
    ("baliza", "Baliza"),
    ("rotatoria", "Rotatória"),
    ("estacionamento", "Estacionamento"),
    ("curva", "Curva"),
    ("marcha-re", "Marcha à ré"),
    ("rodovia", "Rodovia"),
    ("direcao-suave", "Direção suave"),
]


def _db_category(phase_key: str) -> str | None:
    return None if phase_key == "geral" else phase_key


def _phase_key(db_category: str | None) -> str:
    return "geral" if db_category is None else db_category


async def _build_phases(db: AsyncSession) -> list[QuizPhaseRead]:
    question_counts_result = await db.execute(
        select(QuizQuestion.category, func.count(QuizQuestion.id)).group_by(QuizQuestion.category)
    )
    question_counts = {_phase_key(category): count for category, count in question_counts_result.all()}

    sessions_result = await db.execute(
        select(QuizSession.category, QuizSession.score, QuizSession.total_questions)
    )
    best_ratios: dict[str, tuple[int, int]] = {}
    for category, score, total_questions in sessions_result.all():
        if total_questions <= 0:
            continue
        key = _phase_key(category)
        # Uma sessão só conta pro gate da fase se foi jogada contra o conteúdo
        # atual dela — evita que sessões antigas (quiz mudou de tamanho/virou
        # fase) sejam comparadas com um total de perguntas que não existe mais.
        if total_questions != question_counts.get(key):
            continue
        current = best_ratios.get(key)
        if current is None or score / total_questions > current[0] / current[1]:
            best_ratios[key] = (score, total_questions)

    phases: list[QuizPhaseRead] = []
    previous_passed = True
    for phase_key, label in QUIZ_PHASE_ORDER:
        question_count = question_counts.get(phase_key, 0)
        if question_count == 0:
            continue

        best = best_ratios.get(phase_key)
        best_score, best_total = best if best else (None, None)
        unlocked = previous_passed
        phases.append(
            QuizPhaseRead(
                category=_db_category(phase_key),
                label=label,
                question_count=question_count,
                unlocked=unlocked,
                best_score=best_score,
                best_total=best_total,
            )
        )
        previous_passed = unlocked and best is not None and best_score / best_total >= QUIZ_PASS_THRESHOLD

    return phases


async def _is_phase_unlocked(db: AsyncSession, phase_key: str) -> bool:
    phases = await _build_phases(db)
    phase = next((candidate for candidate in phases if _phase_key(candidate.category) == phase_key), None)
    return phase is not None and phase.unlocked


@router.get("/phases", response_model=list[QuizPhaseRead])
async def list_quiz_phases(db: AsyncSession = Depends(get_db)):
    return await _build_phases(db)


@router.get("/questions", response_model=list[QuizQuestionRead])
async def list_quiz_questions(
    category: str | None = Query(default=None), db: AsyncSession = Depends(get_db)
):
    if category is not None and not await _is_phase_unlocked(db, category):
        raise HTTPException(
            status_code=403, detail="Complete a fase anterior com pelo menos 70% para liberar esta."
        )

    query = select(QuizQuestion).order_by(QuizQuestion.id)
    if category is not None:
        query = query.where(QuizQuestion.category == _db_category(category))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/sessions", response_model=QuizSessionRead, status_code=201)
async def create_quiz_session(payload: QuizSessionCreate, db: AsyncSession = Depends(get_db)):
    if payload.category is not None and not await _is_phase_unlocked(db, payload.category):
        raise HTTPException(
            status_code=403, detail="Complete a fase anterior com pelo menos 70% para liberar esta."
        )

    question_ids = [answer.question_id for answer in payload.answers]
    result = await db.execute(select(QuizQuestion).where(QuizQuestion.id.in_(question_ids)))
    questions_by_id = {question.id: question for question in result.scalars().all()}

    score = sum(
        1
        for answer in payload.answers
        if answer.question_id in questions_by_id
        and questions_by_id[answer.question_id].correct_index == answer.selected_index
    )

    session = QuizSession(
        score=score,
        total_questions=len(payload.answers),
        category=_db_category(payload.category) if payload.category is not None else None,
    )
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
