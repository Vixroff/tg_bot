from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_user, get_db_session
from backend.api.schemas import CreateOrderRequest, OrderOut
from backend.database.models import User
from backend.services import orders as orders_service

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("/", response_model=list[OrderOut])
async def list_orders(
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    orders = await orders_service.list_orders_for_user(session, current_user)
    return orders


@router.post("/", response_model=OrderOut)
async def create_order(
    payload: CreateOrderRequest,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    return await orders_service.create_order_from_items(
        session=session,
        user=current_user,
        items_payload=[item.model_dump() for item in payload.items],
    )


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: int,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    order = await orders_service.get_order_for_user(
        session=session,
        user=current_user,
        order_id=order_id,
    )
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return order
