from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class AsyncBase(AsyncAttrs, DeclarativeBase):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )


class User(AsyncBase):
    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(Integer, unique=True)

    username: Mapped[str] = mapped_column(String, nullable=True)
    first_name: Mapped[str] = mapped_column(String, nullable=True)
    last_name: Mapped[str] = mapped_column(String, nullable=True)

    is_admin: Mapped[bool] = mapped_column(default=False)
