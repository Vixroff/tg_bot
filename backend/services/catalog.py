from decimal import Decimal
from typing import Any, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import Product

DEFAULT_PRODUCTS: tuple[dict[str, Any], ...] = (
    {
        "name": "Филе лосося",
        "description": "Свежий лосось для засолки, гриля и домашних ужинов.",
        "price": Decimal("1290.00"),
        "unit": "кг",
        "category": "Красная рыба",
        "image_url": None,
    },
    {
        "name": "Стейки форели",
        "description": "Порционные стейки охлажденной форели для запекания.",
        "price": Decimal("990.00"),
        "unit": "кг",
        "category": "Форель",
        "image_url": None,
    },
    {
        "name": "Креветка северная",
        "description": "Варено-мороженая креветка, подходит для закусок и салатов.",
        "price": Decimal("850.00"),
        "unit": "кг",
        "category": "Морепродукты",
        "image_url": None,
    },
)


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


async def ensure_default_products(session: AsyncSession) -> None:
    result = await session.execute(select(Product.id).limit(1))
    if result.first() is not None:
        return

    session.add_all(Product(is_active=True, **payload) for payload in DEFAULT_PRODUCTS)
    await session.commit()


async def list_products(session: AsyncSession) -> list[dict[str, Any]]:
    await ensure_default_products(session)
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
