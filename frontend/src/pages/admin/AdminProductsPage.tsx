import React from "react";

import { api } from "../../api/endpoints";
import type { Product } from "../../types";

export function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    price: "",
    unit: "kg",
    category: "",
    description: ""
  });

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const p = await api.adminListProducts();
      setProducts(p);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось загрузить товары");
      setProducts([]);
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

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 800 }}>Создать товар</div>
          <button className="btn" disabled={loading} onClick={() => window.location.reload()}>
            Обновить
          </button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div className="row" style={{ justifyContent: "flex-start" }}>
            <input
              className="input"
              placeholder="Название"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Цена"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              style={{ maxWidth: 160 }}
            />
            <input
              className="input"
              placeholder="Ед. (kg/pcs)"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              style={{ maxWidth: 160 }}
            />
          </div>

          <div className="row" style={{ justifyContent: "flex-start" }}>
            <input
              className="input"
              placeholder="Категория"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Описание"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="row" style={{ justifyContent: "flex-start" }}>
            <button
              className="btn primary"
              onClick={async () => {
                try {
                  setLoading(true);
                  const price = Number(form.price);
                  await api.adminCreateProduct({
                    name: form.name.trim(),
                    price,
                    unit: form.unit.trim() || "kg",
                    category: form.category.trim() || null,
                    description: form.description.trim() || null,
                    is_active: true
                  } as any);
                  setForm({ name: "", price: "", unit: "kg", category: "", description: "" });
                  await reload();
                } catch (e: any) {
                  setError(e?.message ?? "Не удалось создать товар");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !form.name.trim() || !form.price.trim()}
            >
              Создать
            </button>
            <span className="muted">Товары создаются активными по умолчанию.</span>
          </div>
        </div>
      </div>

      {!products ? (
        <div className="muted">Загрузка…</div>
      ) : products.length === 0 ? (
        <div className="muted">Товаров пока нет.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {products.map((p) => (
            <ProductRow key={p.id} product={p} onChanged={reload} />
          ))}
        </div>
      )}
    </>
  );
}

function ProductRow({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(product.name);
  const [price, setPrice] = React.useState(String(product.price));
  const [unit, setUnit] = React.useState(product.unit ?? "");
  const [category, setCategory] = React.useState(product.category ?? "");
  const [isActive, setIsActive] = React.useState(product.is_active);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 800 }}>
          #{product.id}{" "}
          <span className="muted" style={{ fontWeight: 600 }}>
            {isActive ? "active" : "inactive"}
          </span>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button
            className="btn"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                await api.adminUpdateProduct(product.id, {
                  name: name.trim(),
                  price: Number(price),
                  unit: unit.trim(),
                  category: category.trim() || null,
                  is_active: isActive
                } as any);
                setError(null);
                onChanged();
              } catch (e: any) {
                setError(e?.message ?? "Не удалось сохранить");
              } finally {
                setLoading(false);
              }
            }}
          >
            Сохранить
          </button>
          <button
            className="btn danger"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                await api.adminDeactivateProduct(product.id);
                setError(null);
                onChanged();
              } catch (e: any) {
                setError(e?.message ?? "Не удалось деактивировать");
              } finally {
                setLoading(false);
              }
            }}
          >
            Деактивировать
          </button>
        </div>
      </div>

      {error && (
        <div className="muted" style={{ marginBottom: 8, color: "rgba(239, 68, 68, 0.9)" }}>
          {error}
        </div>
      )}

      <div className="row" style={{ justifyContent: "flex-start", marginBottom: 10 }}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          className="input"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="decimal"
          style={{ maxWidth: 160 }}
        />
        <input
          className="input"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          style={{ maxWidth: 160 }}
        />
      </div>

      <div className="row" style={{ justifyContent: "flex-start" }}>
        <input
          className="input"
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <label className="row" style={{ justifyContent: "flex-start", gap: 8 }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="muted">Активен</span>
        </label>
      </div>
    </div>
  );
}

