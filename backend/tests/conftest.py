import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture(autouse=True)
def isolated_media_dir(tmp_path, monkeypatch):
    """
    Manda todo upload de teste pra uma pasta temporária.

    O banco dos testes é em memória, mas os arquivos não eram: avatar e fotos
    de prática iam pra `backend/media/` de verdade e ficavam lá pra sempre,
    porque o banco que registrava esses caminhos morria no fim do teste. Cada
    execução da suíte deixava mais imagens falsas de 10 bytes acumuladas.

    O patch é por módulo, não em `app.core.config`: os módulos de API fazem
    `from app.core.config import MEDIA_DIR`, então cada um tem sua própria
    referência, já resolvida no import — trocar só a origem não alcançaria
    nenhuma delas.
    """
    for modulo in ("app.api.learners", "app.api.coach", "app.api.practice_sessions"):
        monkeypatch.setattr(f"{modulo}.MEDIA_DIR", tmp_path)
    # Devolvido pra que um teste que precise conferir o arquivo gravado saiba
    # onde ele foi parar, em vez de importar o MEDIA_DIR real e não achar nada.
    return tmp_path


@pytest_asyncio.fixture
async def session_factory():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield async_sessionmaker(engine, expire_on_commit=False)

    await engine.dispose()


@pytest_asyncio.fixture
async def client(session_factory):
    async def override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_headers(client):
    """Header de Authorization de um aluno descartável, pra testes de
    endpoints que hoje exigem conta de aluno."""
    await client.post(
        "/learners/register", json={"email": "aluno-teste@example.com", "password": "senha1234"}
    )
    login = await client.post(
        "/learners/login", json={"email": "aluno-teste@example.com", "password": "senha1234"}
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
