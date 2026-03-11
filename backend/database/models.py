from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class AsyncBase(AsyncAttrs, DeclarativeBase):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=True)


class User(AsyncBase):
    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(Integer, unique=True)
    username: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    first_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    orders: Mapped[List["Order"]] = relationship(back_populates="user")


class OrderStatus(str, Enum):
    REQUIRES_PAYMENT = "requires_payment"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Product(AsyncBase):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    order_items: Mapped[List["OrderItem"]] = relationship(back_populates="product")


class Order(AsyncBase):
    __tablename__ = "orders"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default=OrderStatus.REQUIRES_PAYMENT.value
    )  # requires_payment, paid, processing, shipped, delivered, cancelled
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    payment: Mapped[Optional["Payment"]] = relationship(
        back_populates="order", uselist=False, cascade="all, delete-orphan"
    )


class OrderItem(AsyncBase):
    __tablename__ = "order_items"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price_at_order: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="order_items")


class Payment(AsyncBase):
    __tablename__ = "payments"

    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, unique=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")  # pending, paid, failed, cancelled
    provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    external_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    order: Mapped["Order"] = relationship(back_populates="payment")
