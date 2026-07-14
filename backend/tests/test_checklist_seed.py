from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.seed import DEFAULT_CHECKLIST_ITEMS, seed_checklist_items
from app.models import ChecklistItem


async def _make_test_session_factory() -> async_sessionmaker:
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    return async_sessionmaker(engine, expire_on_commit=False)


async def test_seed_inserts_default_items_in_order():
    session_factory = await _make_test_session_factory()

    await seed_checklist_items(session_factory)

    async with session_factory() as session:
        result = await session.execute(select(ChecklistItem).order_by(ChecklistItem.order))
        items = result.scalars().all()

    assert len(items) == len(DEFAULT_CHECKLIST_ITEMS)
    assert [item.title for item in items] == DEFAULT_CHECKLIST_ITEMS
    assert [item.order for item in items] == list(range(1, len(DEFAULT_CHECKLIST_ITEMS) + 1))


async def test_seed_is_idempotent():
    session_factory = await _make_test_session_factory()

    await seed_checklist_items(session_factory)
    await seed_checklist_items(session_factory)

    async with session_factory() as session:
        result = await session.execute(select(ChecklistItem))
        items = result.scalars().all()

    assert len(items) == len(DEFAULT_CHECKLIST_ITEMS)
