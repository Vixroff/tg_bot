from __future__ import annotations

from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field, field_validator

from backend.database.models import OrderStatus


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(ge=0)
    unit: str = Field(min_length=1, max_length=50)
    category: str | None = None
    image_url: str | None = None


class ProductCreate(ProductBase):
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, min_length=1, max_length=50)
    is_active: bool | None = None
    category: str | None = None
    image_url: str | None = None

    @field_validator("name", "unit")
    @classmethod
    def _strip_strings(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("must not be empty")
        return value


class ProductOut(ProductBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class OrderItemIn(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class CreateOrderRequest(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)


class OrderProductOut(BaseModel):
    id: int
    name: str
    unit: str
    image_url: str | None = None


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_order: float
    product: OrderProductOut | None


class OrderOut(BaseModel):
    id: int
    user_id: int
    status: OrderStatus
    total_amount: float
    created_at: str | None
    items: list[OrderItemOut]


class PaymentOut(BaseModel):
    id: int
    order_id: int
    amount: float
    status: str
    provider: str | None = None
    external_id: str | None = None


class MockPaymentRequest(BaseModel):
    order_id: int = Field(gt=0)


class MockPaymentResponse(BaseModel):
    order: OrderOut
    payment: PaymentOut


class AdminOrderStatusUpdate(BaseModel):
    status: OrderStatus


class AdminOrderOut(BaseModel):
    id: int
    user_id: int
    user: dict[str, Any] | None
    status: OrderStatus
    total_amount: float
    created_at: str | None
    items: list[dict[str, Any]]


class AdminUserOut(BaseModel):
    id: int
    telegram_id: int
    username: str | None
    first_name: str | None
    last_name: str | None
    is_admin: bool
    created_at: str | None


class AdminUserUpdate(BaseModel):
    is_admin: bool
