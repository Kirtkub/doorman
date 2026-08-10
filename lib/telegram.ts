const TELEGRAM_API = "https://api.telegram.org/bot";

export class TelegramApiError extends Error {
  constructor(message: string, public readonly method: string) {
    super(message);
    this.name = "TelegramApiError";
  }
}

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

export async function telegramApi<T>(
  method: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${TELEGRAM_API}${getBotToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: { ok?: boolean; result?: T; description?: string };
  try {
    data = await response.json();
  } catch {
    throw new TelegramApiError(`Telegram returned an invalid response (${response.status})`, method);
  }

  if (!response.ok || !data.ok) {
    throw new TelegramApiError(
      data.description || `Telegram request failed with status ${response.status}`,
      method,
    );
  }

  return data.result as T;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] as string);
}