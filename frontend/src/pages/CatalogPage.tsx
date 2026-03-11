import React from "react";

import { api } from "../api/endpoints";
import type { Product } from "../types";
import { useCart } from "../state/cart";

export function CatalogPage() {
  const { add } = useCart();
  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listProducts()
      .then((p) => {
        if (cancelled) return;
        setProducts(p);
        setError(null);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message ?? "Ошибка загрузки каталога");
        setProducts([]);
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
          <div style={{ fontSize: 18, fontWeight: 700 }}>Каталог</div>
          <div className="muted" style={{ marginTop: 4 }}>
            Выберите рыбу, добавьте в корзину и оформите заказ.
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

      {!products ? (
        <div className="muted">Загрузка…</div>
      ) : products.length === 0 ? (
        <div className="muted">Пока нет активных товаров.</div>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p.id} className="card product-card">
              <div className="product-title">{p.name}</div>
              <div className="muted product-description">{p.description || "—"}</div>
              <div className="product-footer">
                <div>
                  <div className="product-price">
                    {formatMoney(p.price)}{" "}
                    <span className="muted product-unit">
                      {p.unit ? `за ${p.unit}` : ""}
                    </span>
                  </div>
                  {p.category && <div className="muted product-category">{p.category}</div>}
                </div>
                <button className="btn primary" onClick={() => add(p, 1)}>
                  В корзину
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

