import os
from decimal import Decimal
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
def _test_database_url(tmp_path_factory: pytest.TempPathFactory) -> None:
    db_path = tmp_path_factory.mktemp("db") / "test.db"
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{db_path}"
    os.environ.setdefault("ADMIN_API_TOKEN", "test-admin-token")


@pytest_asyncio.fixture()
async def _db_engine():
    from backend.database.models import AsyncBase

    url = os.environ["DATABASE_URL"]
    engine = create_async_engine(url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(AsyncBase.metadata.create_all)
    try:
        yield engine
    finally:
        async with engine.begin() as conn:
            await conn.run_sync(AsyncBase.metadata.drop_all)
        await engine.dispose()


@pytest_asyncio.fixture()
async def db_session(_db_engine) -> AsyncGenerator[AsyncSession, None]:
    maker = async_sessionmaker(bind=_db_engine, expire_on_commit=False, autoflush=False)
    async with maker() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture()
async def seed_user(db_session: AsyncSession):
    from backend.database.models import User

    user = User(
        telegram_id=123,
        username="testuser",
        first_name="Test",
        last_name="User",
        is_admin=True,
    )
    db_session.add(user)
    await db_session.flush()
    return user


@pytest_asyncio.fixture()
async def seed_products(db_session: AsyncSession):
    from backend.database.models import Product

    p1 = Product(
        name="Salmon",
        description="Fresh salmon",
        price=Decimal("10.50"),
        unit="kg",
        is_active=True,
        category="fish",
        image_url=None,
    )
    p2 = Product(
        name="Tuna (inactive)",
        description=None,
        price=Decimal("12.00"),
        unit="kg",
        is_active=False,
        category="fish",
        image_url=None,
    )
    db_session.add_all([p1, p2])
    await db_session.flush()
    return [p1, p2]


@pytest_asyncio.fixture()
async def app(db_session: AsyncSession):
    from backend.api.dependencies import get_db_session
    from backend.api.main import app as fastapi_app

    async def _override_get_db_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    fastapi_app.dependency_overrides[get_db_session] = _override_get_db_session
    try:
        yield fastapi_app
    finally:
        fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture()
async def client(app):
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers={"X-Telegram-Id": "123"},
    ) as ac:
        yield ac
