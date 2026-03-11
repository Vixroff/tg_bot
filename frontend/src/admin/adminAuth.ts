const STORAGE_KEY = "kosten_admin_token";

export function getAdminToken(): string | null {
  const t = localStorage.getItem(STORAGE_KEY);
  return t && t.trim() ? t : null;
}

export function setAdminToken(token: string) {
  const t = token.trim();
  if (!t) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, t);
}

export function clearAdminToken() {
  localStorage.removeItem(STORAGE_KEY);
}

