import asyncio
import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app import app
from app.core.security import create_access_token, get_password_hash
from app.database.session import get_db
from app.models.base import Base
from app.models.user import User

# Use an in-memory SQLite database for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def engine() -> AsyncGenerator[AsyncEngine]:
    _engine = create_async_engine(TEST_DATABASE_URL)
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    await _engine.dispose()


@pytest.fixture
async def session(engine: AsyncEngine) -> AsyncGenerator[AsyncSession]:
    async with engine.connect() as connection:
        async with connection.begin() as transaction:
            Session = async_sessionmaker(bind=connection, expire_on_commit=False)
            async with Session() as sess:
                yield sess
                await transaction.rollback()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture(autouse=True)
async def override_db(session: AsyncSession):
    async def _get_test_db():
        yield session

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def token_headers(session: AsyncSession) -> dict[str, str]:
    unique_id = str(uuid.uuid4())
    email = f"test_{unique_id}@example.com"
    password = "testpassword"
    user = User(email=email, password_hash=get_password_hash(password), full_name="Test User")
    session.add(user)
    await session.commit()
    await session.refresh(user)

    access_token = create_access_token(subject=user.id)
    return {"Authorization": f"Bearer {access_token}"}
