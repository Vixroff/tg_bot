import React from "react";

import { api } from "../../api/endpoints";
import type { AdminUser } from "../../types";

export function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const u = await api.adminListUsers();
      setUsers(u);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Не удалось загрузить пользователей");
      setUsers([]);
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
        <div className="muted">Всего: {users ? users.length : "—"}</div>
        <button className="btn" disabled={loading} onClick={() => void reload()}>
          Обновить
        </button>
      </div>

      {!users ? (
        <div className="muted">Загрузка…</div>
      ) : users.length === 0 ? (
        <div className="muted">Пользователей пока нет.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {users.map((u) => (
            <UserRow key={u.id} user={u} onChanged={reload} />
          ))}
        </div>
      )}
    </>
  );
}

function UserRow({ user, onChanged }: { user: AdminUser; onChanged: () => Promise<void> }) {
  const [saving, setSaving] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(user.is_admin);
  const [error, setError] = React.useState<string | null>(null);

  const label =
    user.username ? `@${user.username}` : [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="row" style={{ marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 800 }}>
            #{user.id} <span className="muted">({user.telegram_id})</span>
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            {label}
          </div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <label className="row" style={{ justifyContent: "flex-start", gap: 8 }}>
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={saving}
            />
            <span className="muted">Админ</span>
          </label>
          <button
            className="btn primary"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true);
                await api.adminUpdateUser(user.id, { is_admin: isAdmin });
                setError(null);
                await onChanged();
              } catch (e: any) {
                setError(e?.message ?? "Не удалось обновить пользователя");
              } finally {
                setSaving(false);
              }
            }}
          >
            Сохранить
          </button>
        </div>
      </div>

      {error && (
        <div className="muted" style={{ color: "rgba(239, 68, 68, 0.9)" }}>
          {error}
        </div>
      )}
    </div>
  );
}

