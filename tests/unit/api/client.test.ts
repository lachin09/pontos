import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest, errorMessage } from "@/lib/api/client";

const respond = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("apiRequest", () => {
  it("sends JSON bodies with a content type and returns the parsed result", async () => {
    const fetchMock = stubFetch(respond(201, { id: "p1" }));
    await expect(
      apiRequest("/api/x", {
        method: "POST",
        body: { a: 1 },
        headers: { "Idempotency-Key": "k" },
      }),
    ).resolves.toEqual({ id: "p1" });
    expect(fetchMock).toHaveBeenCalledWith("/api/x", {
      method: "POST",
      cache: "no-store",
      signal: undefined,
      headers: { "Content-Type": "application/json", "Idempotency-Key": "k" },
      body: JSON.stringify({ a: 1 }),
    });
  });

  it("passes FormData through untouched so the browser sets the boundary", async () => {
    const fetchMock = stubFetch(respond(200, {}));
    const form = new FormData();
    await apiRequest("/api/upload", { method: "POST", body: form });
    const init = (
      fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(init.body).toBe(form);
    expect(init.headers).toEqual({});
  });

  it("lets callers opt into the browser cache", async () => {
    const fetchMock = stubFetch(respond(200, {}));
    await apiRequest("/api/x", { cache: "default" });
    expect(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].cache,
    ).toBe("default");
  });

  it("throws the server's message with its status", async () => {
    stubFetch(respond(409, { error: "Наявність змінилася" }));
    const error = await apiRequest("/api/x").catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: "Наявність змінилася",
      status: 409,
    });
  });

  it("falls back to the caller's message when the server sends none", async () => {
    stubFetch(new Response("Bad gateway", { status: 502 }));
    await expect(
      apiRequest("/api/x", { fallbackError: "Спробуйте ще раз" }),
    ).rejects.toMatchObject({
      message: "Спробуйте ще раз",
      status: 502,
    });
  });

  it("reports network failures as status 0", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    await expect(apiRequest("/api/x")).rejects.toMatchObject({ status: 0 });
  });

  it("rethrows aborts unchanged", async () => {
    const abort = new DOMException("aborted", "AbortError");
    stubFetch(abort);
    await expect(apiRequest("/api/x")).rejects.toBe(abort);
  });
});

describe("errorMessage", () => {
  it("shows API messages and hides anything else", () => {
    expect(errorMessage(new ApiError("Сервер каже", 400), "Запасне")).toBe(
      "Сервер каже",
    );
    expect(errorMessage(new Error("internal"), "Запасне")).toBe("Запасне");
  });
});
