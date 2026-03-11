import React from "react";
import { Link } from "react-router-dom";

import { api } from "../api/endpoints";
import { useCart } from "../state/cart";
import type { Order, PaymentResult } from "../types";

export function CheckoutPage() {
  const { state, total, clear } = useCart();
  const lines = Object.values(state.lines);

  const [creating, setCreating] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [order, setOrder] = React.useState<Order | null>(null);
  const [payment, setPayment] = React.useState<PaymentResult | null>(null);

  const canCreate = lines.length > 0 && !creating && !order;

  async function onCreateOrder() {
    setError(null);
    setCreating(true);
    try {
      const items = lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity }));
      const created = await api.createOrder(items);
      setOrder(created);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось создать заказ");
    } finally {
      setCreating(false);
    }
  }

  async function onMockPay() {
    if (!order) return;
    setError(null);
    setPaying(true);
    try {
      const res = await api.mockPay(order.id);
      setPayment(res);
      clear();
    } catch (e: any) {
      setError(e?.message ?? "Не удалось оплатить");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Оформление</div>
          <div className="muted" style={{ marginTop: 4 }}>
            В MVP оплата — заглушка (`/api/payments/mock-pay`).
          </div>
        </div>
        <Link className="btn" to="/cart">
          Назад в корзину
        </Link>
      </div>

      {error && (
        <div className="card" style={{ padding: 12, borderColor: "rgba(239, 68, 68, 0.55)", marginBottom: 12 }}>
          <strong>Ошибка</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            {error}
          </div>
        </div>
      )}

      {!lines.length && !order && (
        <div className="muted">
          Корзина пуста. <Link to="/">Перейти в каталог</Link>
        </div>
      )}

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div className="row">
          <div className="muted">Сумма</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{formatMoney(total)}</div>
        </div>
        {order && (
          <div className="muted" style={{ marginTop: 8 }}>
            Заказ №<strong>{order.id}</strong>, статус: <strong>{order.status}</strong>
          </div>
        )}
        {payment && (
          <div className="muted" style={{ marginTop: 8 }}>
            Платёж: <strong>{payment.payment.status}</strong>
          </div>
        )}
      </div>

      {!order ? (
        <button className="btn primary" disabled={!canCreate} onClick={onCreateOrder} style={{ width: "100%" }}>
          {creating ? "Создаём заказ…" : "Создать заказ"}
        </button>
      ) : (
        <button className="btn primary" disabled={paying || order.status === "paid"} onClick={onMockPay} style={{ width: "100%" }}>
          {order.status === "paid" ? "Оплачено" : paying ? "Оплата…" : "Оплатить (mock)"}
        </button>
      )}

      <div className="muted" style={{ marginTop: 12 }}>
        После успешной оплаты корзина очистится, а заказ станет `paid`.
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

