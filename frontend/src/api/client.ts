import { getTelegramUserId } from "../telegram/telegram";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const telegramId = getTelegramUserId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (telegramId) headers["X-Telegram-Id"] = String(telegramId);
  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) headers[k] = v;
  }

  const res = await fetch(path, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "detail" in (data as any)
        ? String((data as any).detail)
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

