import React from "react";
import { Link } from "react-router-dom";

import { api } from "../api/endpoints";
import type { Order } from "../types";

export function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listOrders()
      .then((o) => {
        if (cancelled) return;
        setOrders(o);
        setError(null);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message ?? "Не удалось загрузить заказы");
        setOrders([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Мои заказы</div>
          <div className="muted" style={{ marginTop: 4 }}>
            История заказов, созданных через Mini App.
          </div>
        </div>
        <button className="btn" disabled={loading} onClick={() => window.location.reload()}>
          Обновить
        </button>
      </div>

      {error && (
        <div className="card" style={{ padding: 12, borderColor: "rgba(239, 68, 68, 0.55)", marginBottom: 12 }}>
          <strong>Ошибка</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            {error}
          </div>
        </div>
      )}

      {!orders ? (
        <div className="muted">Загрузка…</div>
      ) : orders.length === 0 ? (
        <div className="muted">
          Заказов пока нет. <Link to="/">Перейти в каталог</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="card" style={{ padding: 12 }}>
              <div className="row">
                <div>
                  <div style={{ fontWeight: 800 }}>Заказ №{o.id}</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {o.created_at ? new Date(o.created_at).toLocaleString("ru-RU") : "—"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800 }}>{formatMoney(o.total_amount)}</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {o.status}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

