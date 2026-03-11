import React from "react";

import { getTelegramUserId, getWebApp } from "./telegram";

type TelegramContextValue = {
  telegramId: number | null;
  isInTelegram: boolean;
  userLabel: string | null;
};

const TelegramContext = React.createContext<TelegramContextValue | null>(null);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [telegramId, setTelegramId] = React.useState<number | null>(null);
  const [isInTelegram, setIsInTelegram] = React.useState(false);
  const [userLabel, setUserLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const wa = getWebApp();
    if (wa) {
      setIsInTelegram(true);
      try {
        wa.ready();
        wa.expand();
      } catch {
        // no-op
      }
    }

    const id = getTelegramUserId();
    setTelegramId(id);

    const tgUser = wa?.initDataUnsafe?.user;
    if (tgUser) {
      const label =
        tgUser.username ||
        [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") ||
        String(tgUser.id);
      setUserLabel(label);
    }

    if (wa?.themeParams) {
      const tp = wa.themeParams;
      const bg = tp.bg_color || tp.secondary_bg_color;
      const text = tp.text_color;
      if (bg) document.documentElement.style.setProperty("--tg-bg", bg);
      if (text) document.documentElement.style.setProperty("--tg-text", text);
    }
  }, []);

  const value = React.useMemo(
    () => ({ telegramId, isInTelegram, userLabel }),
    [telegramId, isInTelegram, userLabel]
  );

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const ctx = React.useContext(TelegramContext);
  if (!ctx) throw new Error("useTelegram must be used within TelegramProvider");
  return ctx;
}

