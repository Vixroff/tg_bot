from typing import Any, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import Product


def serialize_product(product: Product) -> dict[str, Any]:
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


async def list_products(session: AsyncSession) -> list[dict[str, Any]]:
    result = await session.execute(select(Product).where(Product.is_active.is_(True)).order_by(Product.id))
    products: Sequence[Product] = result.scalars().all()
    return [serialize_product(product) for product in products]


async def get_product_by_id(
    session: AsyncSession,
    product_id: int,
) -> dict[str, Any] | None:
    result = await session.execute(select(Product).where(Product.id == product_id).where(Product.is_active.is_(True)))
    product = result.scalar_one_or_none()
    if product is None:
        return None
    return serialize_product(product)
