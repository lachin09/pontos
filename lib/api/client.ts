/**
 * The one place browser code talks HTTP to our own API routes. Components
 * call typed functions (see lib/api/*.ts) instead of building fetch requests,
 * so they depend on what an operation does, not on how it is transported.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NETWORK_ERROR = "Немає з’єднання. Перевірте інтернет і спробуйте ще раз.";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Sent as JSON unless it is FormData. */
  body?: unknown;
  headers?: Record<string, string>;
  /** Used when the server response carries no message of its own. */
  fallbackError?: string;
  signal?: AbortSignal;
  /** Our API responses are live data by default. */
  cache?: RequestCache;
};

export async function apiRequest<T = void>(
  url: string,
  {
    method = "GET",
    body,
    headers = {},
    fallbackError = "Не вдалося виконати дію. Спробуйте ще раз.",
    signal,
    cache = "no-store",
  }: RequestOptions = {},
): Promise<T> {
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      cache,
      signal,
      headers: isForm
        ? headers
        : body === undefined
          ? headers
          : { "Content-Type": "application/json", ...headers },
      body: isForm
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(NETWORK_ERROR, 0);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : fallbackError;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

/** A user-facing message for any error thrown by an API call. */
export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
