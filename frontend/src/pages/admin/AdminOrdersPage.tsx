import React from "react";

import { api } from "../../api/endpoints";
import type { AdminOrder } from "../../types";

const STATUSES = ["new", "paid", "processing", "shipped", "delivered", "cancelled"];

export function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<AdminOrder[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const o = await api.adminListOrders();
      setOrders(o);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось загрузить заказы");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <>
      {error && (
        <div
          className="card"
          style={{
            padding: 12,
            borderColor: "rgba(239, 68, 68, 0.55)",
            marginBottom: 12
          }}
        >
          <strong>Ошибка</strong>
          <div className="muted" style={{ marginTop: 6 }}>
            {error}
          </div>
        </div>
      )}

      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div className="muted">Всего: {orders ? orders.length : "—"}</div>
        <button className="btn" disabled={loading} onClick={() => void reload()}>
          Обновить
        </button>
      </div>

      {!orders ? (
        <div className="muted">Загрузка…</div>
      ) : orders.length === 0 ? (
        <div className="muted">Заказов пока нет.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} onChanged={reload} />
          ))}
        </div>
      )}
    </>
  );
}

function OrderRow({ order, onChanged }: { order: AdminOrder; onChanged: () => Promise<void> }) {
  const [status, setStatus] = React.useState(order.status);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800 }}>Заказ №{order.id}</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {order.created_at ? new Date(order.created_at).toLocaleString("ru-RU") : "—"}
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            Пользователь:{" "}
            <strong>
              {order.user?.username ? `@${order.user.username}` : order.user?.telegram_id ?? order.user_id}
            </strong>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800 }}>{formatMoney(order.total_amount)}</div>
          <div className="muted" style={{ marginTop: 4 }}>
            {order.items.length} поз.
          </div>
        </div>
      </div>

      {error && (
        <div className="muted" style={{ marginBottom: 10, color: "rgba(239, 68, 68, 0.9)" }}>
          {error}
        </div>
      )}

      <div className="row" style={{ justifyContent: "flex-start" }}>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          className="btn primary"
          disabled={saving}
          onClick={async () => {
            try {
              setSaving(true);
              await api.adminUpdateOrder(order.id, { status });
              setError(null);
              await onChanged();
            } catch (e: any) {
              setError(e?.message ?? "Не удалось обновить статус");
            } finally {
              setSaving(false);
            }
          }}
        >
          Сохранить статус
        </button>
        <span className="muted">Допустимые статусы: {STATUSES.join(", ")}</span>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {order.items.map((it) => (
          <div key={it.id} className="card" style={{ padding: 10 }}>
            <div className="row">
              <div>
                <div style={{ fontWeight: 700 }}>
                  {it.product?.name ?? `Product #${it.product_id}`}
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {it.quantity} × {formatMoney(it.price_at_order)}
                </div>
              </div>
              <div style={{ fontWeight: 800 }}>{formatMoney(it.price_at_order * it.quantity)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

