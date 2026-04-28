import React from "react";

import { api } from "../api/endpoints";
import type { Product } from "../types";
import { useCart } from "../state/cart";

export function CatalogPage() {
  const { add } = useCart();
  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const categories = React.useMemo(
    () => Array.from(new Set((products ?? []).map((product) => product.category).filter(Boolean))),
    [products]
  );
  const featuredProduct = React.useMemo(() => {
    if (!products || products.length === 0) return null;
    return [...products].sort((left, right) => right.price - left.price)[0];
  }, [products]);

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
    <div style={{ display: "grid", gap: 14 }}>
      <section className="card hero-card">
        <div className="hero-badge">Свежие поставки для Mini App</div>
        <h1 className="hero-title">Рыба и морепродукты с быстрым оформлением заказа</h1>
        <p className="muted hero-description">
          На стартовой странице показываем актуальный ассортимент из базы: открывай каталог, выбирай товар и
          оформляй заказ в несколько шагов.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{products?.length ?? 0}</span>
            <span className="muted">товаров доступно</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">{categories.length}</span>
            <span className="muted">категорий</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">{featuredProduct ? formatMoney(featuredProduct.price) : "—"}</span>
            <span className="muted">макс. цена в каталоге</span>
          </div>
        </div>
      </section>

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
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(value);
}

