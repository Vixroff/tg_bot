export type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  platform?: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

const DEV_TG_ID_KEY = "devTelegramId";

export function getTelegramUserId(): number | null {
  const wa = getWebApp();
  const fromTg = wa?.initDataUnsafe?.user?.id;
  if (typeof fromTg === "number" && Number.isFinite(fromTg)) return fromTg;

  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("tg_id");
  if (fromQuery) {
    const parsed = Number(fromQuery);
    if (Number.isFinite(parsed) && parsed > 0) {
      localStorage.setItem(DEV_TG_ID_KEY, String(parsed));
      return parsed;
    }
  }

  const fromStorage = localStorage.getItem(DEV_TG_ID_KEY);
  if (!fromStorage) return null;
  const parsed = Number(fromStorage);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function setDevTelegramUserId(id: number) {
  localStorage.setItem(DEV_TG_ID_KEY, String(id));
}

