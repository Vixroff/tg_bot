import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { clearAdminToken, getAdminToken, setAdminToken } from "../../admin/adminAuth";

export function AdminLayout() {
  const loc = useLocation();
  const [token, setToken] = React.useState(() => getAdminToken() ?? "");

  const tabClass = (path: string) => (loc.pathname === path ? "btn primary" : "btn");

  return (
    <div className="card" style={{ padding: 14 }}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Админ-панель</div>
          <div className="muted" style={{ marginTop: 4 }}>
            Для запросов нужны заголовки <strong>X-Telegram-Id</strong> и{" "}
            <strong>X-Admin-Token</strong>.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "flex-start" }}>
          <input
            className="input"
            placeholder="X-Admin-Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ maxWidth: 420 }}
          />
          <button
            className="btn primary"
            onClick={() => {
              setAdminToken(token);
              window.location.reload();
            }}
          >
            Сохранить
          </button>
          <button
            className="btn danger"
            onClick={() => {
              clearAdminToken();
              setToken("");
              window.location.reload();
            }}
          >
            Очистить
          </button>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-start", marginBottom: 12 }}>
        <Link className={tabClass("/admin/products")} to="/admin/products">
          Товары
        </Link>
        <Link className={tabClass("/admin/orders")} to="/admin/orders">
          Заказы
        </Link>
        <Link className={tabClass("/admin/users")} to="/admin/users">
          Пользователи
        </Link>
      </div>

      <Outlet />
    </div>
  );
}

