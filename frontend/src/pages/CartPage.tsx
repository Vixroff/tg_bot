import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../state/cart";

export function CartPage() {
  const { state, setQty, remove, total, clear } = useCart();
  const nav = useNavigate();

  const lines = Object.values(state.lines);

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Корзина</div>
          <div className="muted" style={{ marginTop: 4 }}>
            Проверьте количество и переходите к оформлению.
          </div>
        </div>
        <div className="row">
          <button className="btn danger" disabled={!lines.length} onClick={() => clear()}>
            Очистить
          </button>
          <button className="btn primary" disabled={!lines.length} onClick={() => nav("/checkout")}>
            Оформить
          </button>
        </div>
      </div>

      {!lines.length ? (
        <div className="muted">
          Корзина пуста. <Link to="/">Перейти в каталог</Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 10 }}>
            {lines.map((l) => (
              <div key={l.product.id} className="card" style={{ padding: 12 }}>
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 700 }}>{l.product.name}</div>
                    <div className="muted" style={{ marginTop: 4 }}>
                      {formatMoney(l.product.price)} {l.product.unit ? `за ${l.product.unit}` : ""}
                    </div>
                  </div>
                  <button className="btn danger" onClick={() => remove(l.product.id)}>
                    Удалить
                  </button>
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <div className="row" style={{ justifyContent: "flex-start" }}>
                    <button className="btn" onClick={() => setQty(l.product.id, l.quantity - 1)}>
                      −
                    </button>
                    <input
                      className="input"
                      style={{ width: 90, textAlign: "center" }}
                      inputMode="numeric"
                      value={String(l.quantity)}
                      onChange={(e) => setQty(l.product.id, Number(e.target.value))}
                    />
                    <button className="btn" onClick={() => setQty(l.product.id, l.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatMoney(l.product.price * l.quantity)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="row" style={{ marginTop: 14 }}>
            <div className="muted">Итого</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{formatMoney(total)}</div>
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            В MVP корзина хранится локально в Mini App.
          </div>
        </>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

