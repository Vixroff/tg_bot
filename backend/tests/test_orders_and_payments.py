import pytest


@pytest.mark.asyncio
async def test_create_order_then_get_and_mock_pay(client, seed_user, seed_products):
    # create order
    create_resp = await client.post(
        "/api/orders/",
        json={"items": [{"product_id": seed_products[0].id, "quantity": 2}]},
    )
    assert create_resp.status_code == 200
    order = create_resp.json()
    assert order["status"] == "requires_payment"
    assert order["total_amount"] == 21.0
    assert len(order["items"]) == 1

    # get order
    get_resp = await client.get(f"/api/orders/{order['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == order["id"]

    # mock pay
    pay_resp = await client.post("/api/payments/mock-pay", json={"order_id": order["id"]})
    assert pay_resp.status_code == 200
    payload = pay_resp.json()
    assert payload["order"]["status"] == "paid"
    assert payload["payment"]["status"] == "paid"
    assert payload["payment"]["provider"] == "mock"


@pytest.mark.asyncio
async def test_create_order_rejects_empty_items(client, seed_user):
    resp = await client.post("/api/orders/", json={"items": []})
    assert resp.status_code == 422
