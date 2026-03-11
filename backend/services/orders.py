from __future__ import annotations

from decimal import Decimal
from typing import Any, Iterable, Sequence

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from backend.database.models import Order, OrderItem, OrderStatus, Product, User


def _decimal_to_float(value: Decimal) -> float:
    return float(value)


def serialize_order_item(item: OrderItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "product_id": item.product_id,
        "quantity": item.quantity,
        "price_at_order": _decimal_to_float(item.price_at_order),
        "product": {
            "id": item.product.id,
            "name": item.product.name,
            "unit": item.product.unit,
            "image_url": item.product.image_url,
        }
        if item.product
        else None,
    }


def serialize_order(order: Order) -> dict[str, Any]:
    return {
        "id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "total_amount": _decimal_to_float(order.total_amount),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [serialize_order_item(item) for item in order.items],
    }


async def list_orders_for_user(
    session: AsyncSession,
    user: User,
) -> list[dict[str, Any]]:
    result = await session.execute(
        select(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
    )
    orders: Sequence[Order] = result.scalars().unique().all()
    return [serialize_order(order) for order in orders]


async def get_order_for_user(
    session: AsyncSession,
    user: User,
    order_id: int,
) -> dict[str, Any] | None:
    result = await session.execute(
        select(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .where(Order.id == order_id, Order.user_id == user.id)
    )
    order = result.unique().scalar_one_or_none()
    if order is None:
        return None
    return serialize_order(order)


async def create_order_from_items(
    session: AsyncSession,
    user: User,
    items_payload: Iterable[dict[str, Any]],
) -> dict[str, Any]:

    products_result = await session.execute(
        select(Product).where(
            Product.id.in_({int(item["product_id"]) for item in items_payload}), Product.is_active.is_(True)
        )
    )
    products_by_id: dict[int, Product] = {product.id: product for product in products_result.scalars().all()}

    if len(products_by_id) != len(items_payload):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some products are not available",
        )

    total_amount = Decimal("0.00")
    order_items: list[OrderItem] = []

    for raw_item in items_payload:
        product_id = int(raw_item["product_id"])
        quantity = int(raw_item.get("quantity", 1))

        if quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be positive",
            )

        product = products_by_id[product_id]
        line_total = product.price * quantity
        total_amount += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=quantity,
                price_at_order=product.price,
            )
        )

    order = Order(user_id=user.id, status=OrderStatus.REQUIRES_PAYMENT.value, total_amount=total_amount)
    order.items.extend(order_items)

    session.add(order)
    await session.commit()
    await session.refresh(order)

    await session.refresh(order, attribute_names=["items"])

    return serialize_order(order)
