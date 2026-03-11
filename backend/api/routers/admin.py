from __future__ import annotations

from decimal import Decimal
from typing import Any, Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from backend.api.dependencies import get_admin_user, get_db_session
from backend.api.schemas import (
    AdminOrderOut,
    AdminOrderStatusUpdate,
    AdminUserOut,
    AdminUserUpdate,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)
from backend.database.models import Order, OrderItem, Product, User

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/products", response_model=list[ProductOut])
async def admin_list_products(
    include_inactive: bool = True,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> list[dict[str, Any]]:
    _ = admin_user
    stmt = select(Product).order_by(Product.id)
    if not include_inactive:
        stmt = stmt.where(Product.is_active.is_(True))
    result = await session.execute(stmt)
    products: Sequence[Product] = result.scalars().all()
    return [_serialize_product(p) for p in products]


@router.post("/products", response_model=ProductOut)
async def admin_create_product(
    payload: ProductCreate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> dict[str, Any]:
    _ = admin_user
    product = _product_from_payload(payload.model_dump())
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return _serialize_product(product)


@router.patch("/products/{product_id}", response_model=ProductOut)
async def admin_update_product(
    product_id: int,
    payload: ProductUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> dict[str, Any]:
    _ = admin_user
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    _apply_product_patch(product, payload.model_dump(exclude_unset=True))
    await session.commit()
    await session.refresh(product)
    return _serialize_product(product)


@router.delete("/products/{product_id}", response_model=ProductOut)
async def admin_deactivate_product(
    product_id: int,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> dict[str, Any]:
    _ = admin_user
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = False
    await session.commit()
    await session.refresh(product)
    return _serialize_product(product)


@router.get("/orders", response_model=list[AdminOrderOut])
async def admin_list_orders(
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> list[dict[str, Any]]:
    _ = admin_user
    result = await session.execute(
        select(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
    )
    orders: Sequence[Order] = result.scalars().unique().all()
    return [_serialize_order_admin(order) for order in orders]


@router.patch("/orders/{order_id}", response_model=AdminOrderOut)
async def admin_update_order(
    order_id: int,
    payload: AdminOrderStatusUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> dict[str, Any]:
    _ = admin_user
    new_status = payload.status.value

    result = await session.execute(
        select(Order)
        .options(
            joinedload(Order.user),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order.status = new_status
    await session.commit()
    await session.refresh(order)
    return _serialize_order_admin(order)


@router.get("/users", response_model=list[AdminUserOut])
async def admin_list_users(
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> list[dict[str, Any]]:
    _ = admin_user
    result = await session.execute(select(User).order_by(User.id))
    users: Sequence[User] = result.scalars().all()
    return [
        {
            "id": u.id,
            "telegram_id": u.telegram_id,
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.patch("/users/{user_id}", response_model=AdminUserOut)
async def admin_update_user(
    user_id: int,
    payload: AdminUserUpdate,
    session: AsyncSession = Depends(get_db_session),
    admin_user: User = Depends(get_admin_user),
) -> dict[str, Any]:
    _ = admin_user

    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_admin = payload.is_admin
    await session.commit()
    await session.refresh(user)
    return {
        "id": user.id,
        "telegram_id": user.telegram_id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _serialize_product(product: Product) -> dict[str, Any]:
    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "unit": product.unit,
        "is_active": product.is_active,
        "category": product.category,
        "image_url": product.image_url,
    }


def _require_str(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{key}' must be a non-empty string",
        )
    return value.strip()


def _optional_str(payload: dict[str, Any], key: str) -> str | None:
    value = payload.get(key)
    if value is None:
        return None
    if not isinstance(value, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{key}' must be a string or null",
        )
    return value


def _require_price(payload: dict[str, Any]) -> Decimal:
    value = payload.get("price")
    if isinstance(value, (int, float, str)):
        try:
            price = Decimal(str(value))
        except Exception:  # noqa: BLE001
            price = None
        if price is not None and price >= 0:
            return price
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="'price' must be a non-negative number",
    )


def _product_from_payload(payload: dict[str, Any]) -> Product:
    return Product(
        name=_require_str(payload, "name"),
        description=_optional_str(payload, "description"),
        price=_require_price(payload),
        unit=_require_str(payload, "unit"),
        category=_optional_str(payload, "category"),
        image_url=_optional_str(payload, "image_url"),
        is_active=bool(payload.get("is_active", True)),
    )


def _apply_product_patch(product: Product, payload: dict[str, Any]) -> None:
    allowed_keys = {
        "name",
        "description",
        "price",
        "unit",
        "is_active",
        "category",
        "image_url",
    }
    unknown = set(payload.keys()) - allowed_keys
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown fields: {', '.join(sorted(unknown))}",
        )

    if "name" in payload:
        product.name = _require_str(payload, "name")
    if "description" in payload:
        product.description = _optional_str(payload, "description")
    if "price" in payload:
        product.price = _require_price(payload)
    if "unit" in payload:
        product.unit = _require_str(payload, "unit")
    if "category" in payload:
        product.category = _optional_str(payload, "category")
    if "image_url" in payload:
        product.image_url = _optional_str(payload, "image_url")
    if "is_active" in payload:
        is_active = payload.get("is_active")
        if not isinstance(is_active, bool):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="'is_active' must be boolean",
            )
        product.is_active = is_active


def _decimal_to_float(value: Decimal) -> float:
    return float(value)


def _serialize_order_admin(order: Order) -> dict[str, Any]:
    return {
        "id": order.id,
        "user_id": order.user_id,
        "user": {
            "id": order.user.id,
            "telegram_id": order.user.telegram_id,
            "username": order.user.username,
        }
        if order.user
        else None,
        "status": order.status,
        "total_amount": _decimal_to_float(order.total_amount),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [
            {
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
            for item in order.items
        ],
    }
