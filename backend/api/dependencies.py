import os
from typing import AsyncGenerator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.engine import get_async_session
from backend.database.models import User


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an AsyncSession."""
    async for session in get_async_session():
        yield session


async def get_current_user(
    x_telegram_id: int = Header(..., alias="X-Telegram-Id"),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    result = await session.execute(select(User).where(User.telegram_id == x_telegram_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found for provided telegram id",
        )
    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
    admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
) -> User:
    expected_token = os.getenv("ADMIN_API_TOKEN")
    if not expected_token or admin_token != expected_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
        )
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not admin",
        )
    return current_user
