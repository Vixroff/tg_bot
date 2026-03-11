import React from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../api/endpoints";
import type { Order } from "../types";

export function OrderDetailsPage() {
  const params = useParams();
  const orderId = Number(params.orderId);

  const [order, setOrder] = React.useState<Order | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!Number.isFinite(orderId)) {
      setError("Некорректный id заказа");
      return;
    }
    let cancelled = false;
    api
      .getOrder(orderId)
      .then((o) => {
        if (cancelled) return;
        setOrder(o);
        setError(null);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message ?? "Не удалось загрузить заказ");
        setOrder(null);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Детали заказа</div>
          <div className="muted" style={{ marginTop: 4 }}>
            Состав и итоговая сумма.
          </div>
        </div>
        <Link className="btn" to="/orders">
          Назад
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

      {!order ? (
        !error ? <div className="muted">Загрузка…</div> : null
      ) : (
        <>
          <div className="card" style={{ padding: 12, marginBottom: 12 }}>
            <div className="row">
              <div>
                <div style={{ fontWeight: 800 }}>Заказ №{order.id}</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {order.created_at ? new Date(order.created_at).toLocaleString("ru-RU") : "—"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800 }}>{formatMoney(order.total_amount)}</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {order.status}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {order.items.map((it) => (
              <div key={it.id} className="card" style={{ padding: 12 }}>
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {it.product?.name ?? `Product #${it.product_id}`}
                    </div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {it.quantity} × {formatMoney(it.price_at_order)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800 }}>
                    {formatMoney(it.price_at_order * it.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

