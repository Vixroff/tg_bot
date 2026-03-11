import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { TelegramProvider, useTelegram } from "../telegram/TelegramProvider";
import { setDevTelegramUserId } from "../telegram/telegram";
import { CartProvider, useCart } from "../state/cart";

export function RootLayout() {
  return (
    <div className="app-shell">
      <TelegramProvider>
        <CartProvider>
          <LayoutInner />
        </CartProvider>
      </TelegramProvider>
    </div>
  );
}

function LayoutInner() {
  const { telegramId, isInTelegram, userLabel } = useTelegram();
  const { totalItems } = useCart();
  const nav = useNavigate();
  const loc = useLocation();

  const [devInput, setDevInput] = React.useState("");

  const isActive = (path: string) => (loc.pathname === path ? "primary" : "");

  return (
    <div className="main-shell">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="row" style={{ justifyContent: "flex-start" }}>
            <span className="badge">
              <span className="logo">
                <span className="logo-icon" aria-hidden="true">
                  🦀
                </span>
                <span className="logo-icon" aria-hidden="true">
                  🐟
                </span>
                <span>
                  <span className="logo-text-main">Kosten</span>
                  <span className="logo-text-sub">
                    {isInTelegram ? "Fish Market Mini App" : "Fish Market Web"}
                  </span>
                </span>
              </span>
            </span>
          </div>
          <div className="row">
            <Link className={`btn ${isActive("/")}`} to="/">
              Каталог
            </Link>
            <Link className={`btn ${isActive("/orders")}`} to="/orders">
              Заказы
            </Link>
            <Link className={`btn ${isActive("/cart")}`} to="/cart">
              Корзина{totalItems ? ` (${totalItems})` : ""}
            </Link>
            <Link className={`btn ${loc.pathname.startsWith("/admin") ? "primary" : ""}`} to="/admin">
              Админ
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="card" style={{ padding: 14, marginBottom: 14 }}>
          <div className="row">
            <div>
              <div>
                <strong>Пользователь</strong>{" "}
                <span className="muted">
                  {userLabel ? `@${userLabel}` : "—"}
                </span>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                Telegram ID: <strong>{telegramId ?? "не найден"}</strong>
              </div>
            </div>
            {telegramId ? (
              <button className="btn" onClick={() => nav("/cart")}>
                Перейти в корзину
              </button>
            ) : (
              <button className="btn primary" onClick={() => nav("/")}>
                Открыть каталог
              </button>
            )}
          </div>

          {!telegramId && (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ marginBottom: 8 }}>
                Для запросов к API нужен `X-Telegram-Id`. В Telegram он берётся
                автоматически; локально можно указать dev id.
              </div>
              <div className="row" style={{ justifyContent: "flex-start" }}>
                <input
                  className="input"
                  placeholder="dev Telegram ID (например 123456)"
                  value={devInput}
                  onChange={(e) => setDevInput(e.target.value)}
                  inputMode="numeric"
                  style={{ maxWidth: 260 }}
                />
                <button
                  className="btn"
                  onClick={() => {
                    const id = Number(devInput);
                    if (Number.isFinite(id) && id > 0) {
                      setDevTelegramUserId(id);
                      window.location.reload();
                    }
                  }}
                >
                  Сохранить
                </button>
                <span className="muted">
                  или добавьте `?tg_id=...` к URL
                </span>
              </div>
            </div>
          )}
        </div>

        <Outlet />
      </div>
      <footer className="footer">
        <div className="footer-inner">
          <span className="muted">Свежая рыба, краб и морепродукты для Mini App.</span>
          <span className="muted">
            Kosten · 🦀 + 🐟
          </span>
        </div>
      </footer>
    </div>
  );
}

