from __future__ import annotations

from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from backend.database.models import Order, OrderItem, OrderStatus, Payment, User
from backend.services.orders import serialize_order


def serialize_payment(payment: Payment) -> dict[str, Any]:
    return {
        "id": payment.id,
        "order_id": payment.order_id,
        "amount": float(payment.amount),
        "status": payment.status,
        "provider": payment.provider,
        "external_id": payment.external_id,
    }


async def mock_pay_order(
    session: AsyncSession,
    user: User,
    order_id: int,
) -> dict[str, Any]:
    result = await session.execute(
        select(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .where(Order.id == order_id, Order.user_id == user.id)
    )
    order = result.unique().scalar_one_or_none()

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    payment_result = await session.execute(select(Payment).where(Payment.order_id == order.id))
    payment = payment_result.scalar_one_or_none()

    if payment is None:
        payment = Payment(
            order_id=order.id,
            amount=order.total_amount or Decimal("0.00"),
            status="pending",
            provider="mock",
            external_id=None,
        )
        session.add(payment)

    payment.status = "paid"
    order.status = OrderStatus.PAID.value

    await session.commit()
    await session.refresh(payment)
    await session.refresh(order)

    return {
        "order": serialize_order(order),
        "payment": serialize_payment(payment),
    }
