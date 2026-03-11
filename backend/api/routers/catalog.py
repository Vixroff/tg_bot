from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.dependencies import get_current_user, get_db_session
from backend.api.schemas import ProductOut
from backend.database.models import User
from backend.services import catalog as catalog_service

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("/products", response_model=list[ProductOut])
async def list_products(
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    _ = current_user
    return await catalog_service.list_products(session)


@router.get("/products/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: int,
    session: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    _ = current_user
    product = await catalog_service.get_product_by_id(session, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product
