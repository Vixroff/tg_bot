import pytest


@pytest.mark.asyncio
async def test_catalog_lists_only_active_products(client, seed_user, seed_products):
    resp = await client.get("/api/catalog/products")
    assert resp.status_code == 200
    data = resp.json()

    assert isinstance(data, list)
    assert [p["name"] for p in data] == ["Salmon"]
    assert data[0]["is_active"] is True


@pytest.mark.asyncio
async def test_catalog_get_product_404(client, seed_user):
    resp = await client.get("/api/catalog/products/99999")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Product not found"
