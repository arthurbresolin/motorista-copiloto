import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.session import async_session
from app.models import ChecklistItem

DEFAULT_CHECKLIST_ITEMS = [
    "Ajustar espelhos",
    "Colocar cinto de segurança",
    "Ajustar banco",
    "Ajustar volante",
    "Soltar freio de mão",
    "Verificar combustível",
    "Verificar pneus",
    "Verificar retrovisor",
]


async def seed_checklist_items(
    session_factory: async_sessionmaker = async_session,
) -> None:
    async with session_factory() as session:
        existing = await session.scalar(select(ChecklistItem.id).limit(1))
        if existing is not None:
            print("checklist_items já populada, pulando seed.")
            return

        session.add_all(
            ChecklistItem(title=title, order=order)
            for order, title in enumerate(DEFAULT_CHECKLIST_ITEMS, start=1)
        )
        await session.commit()
        print(f"{len(DEFAULT_CHECKLIST_ITEMS)} itens de checklist inseridos.")


if __name__ == "__main__":
    asyncio.run(seed_checklist_items())
