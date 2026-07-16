import asyncio

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.session import async_session
from app.models.car import Car
from app.models.checklist import ChecklistSession, checklist_session_items
from app.models.monitor_session import MonitorSession
from app.models.practice_session import PracticeSession
from app.models.quiz import QuizSession

# Apaga dados de uso (sessões reais que só existem porque foram criadas
# durante o desenvolvimento/teste do app) mantendo dados de configuração
# (checklist_items, quiz_questions) intocados. Roda uma vez, manualmente,
# contra o banco de dev real - não é uma migration Alembic porque não
# muda schema, é só uma limpeza pontual de ambiente.


async def wipe_dev_data(session_factory: async_sessionmaker = async_session) -> None:
    async with session_factory() as session:
        # Ordem de dependência: tabela de junção antes das sessões de checklist.
        await session.execute(delete(checklist_session_items))
        await session.execute(delete(ChecklistSession))
        await session.execute(delete(PracticeSession))
        await session.execute(delete(MonitorSession))
        await session.execute(delete(Car))
        await session.execute(delete(QuizSession))
        await session.commit()
        print(
            "Apagados: checklist_sessions, practice_sessions, monitor_sessions, "
            "cars, quiz_sessions."
        )
        print("Mantidos: checklist_items (itens padrão) e quiz_questions (banco de perguntas).")


if __name__ == "__main__":
    asyncio.run(wipe_dev_data())
