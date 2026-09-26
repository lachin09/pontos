import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const getActiveAdminSession = vi.fn();
vi.mock("@/lib/supabase/admin-session", () => ({ getActiveAdminSession }));
vi.mock("@/lib/server/admin-services", () => ({
  createAdminServices: (client: unknown) => ({ client }),
}));

const { adminRoute, assertSameOrigin, readJson, route } =
  await import("@/lib/http/route");
const { conflict } = await import("@/lib/errors");

const request = (body?: string, headers: Record<string, string> = {}) =>
  new Request("https://pontos.test/api/thing", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });

beforeEach(() => getActiveAdminSession.mockReset());

describe("route()", () => {
  it("passes successful responses through", async () => {
    const handler = route(async () =>
      Response.json({ ok: true }, { status: 201 }),
    );
    const response = await handler(request(), {});
    expect(response.status).toBe(201);
  });

  it("turns AppErrors into JSON with their status and message", async () => {
    const handler = route(async () => {
      throw conflict("Вже існує");
    });
    const response = await handler(request(), {});
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "Вже існує" });
  });

  it("hides unexpected errors behind a generic 500 and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = route(async () => {
      throw new Error("secret stack detail");
    });
    const response = await handler(request(), {});
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).not.toContain("secret");
    expect(log).toHaveBeenCalledWith(
      "Unhandled error in POST /api/thing",
      "secret stack detail",
    );
  });
});

describe("adminRoute()", () => {
  it("rejects requests without an active admin session", async () => {
    getActiveAdminSession.mockResolvedValue(null);
    const inner = vi.fn();
    const response = await adminRoute(inner)(request(), {});
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Потрібен доступ адміністратора.",
    });
    expect(inner).not.toHaveBeenCalled();
  });

  it("gives the handler services built on the admin's own client", async () => {
    const client = { name: "admin-client" };
    getActiveAdminSession.mockResolvedValue({ supabase: client, userId: "u1" });
    const inner = vi.fn(
      async (_req: Request, ctx: { services: unknown; params: string }) =>
        Response.json({ services: ctx.services, params: ctx.params }),
    );
    const response = await adminRoute<{ params: string }>(inner)(request(), {
      params: "p",
    });
    await expect(response.json()).resolves.toEqual({
      services: { client },
      params: "p",
    });
  });
});

describe("readJson()", () => {
  const schema = z.object({ name: z.string().min(2, "Назва закоротка") });

  it("returns validated data", async () => {
    await expect(
      readJson(request('{"name":"Пальто"}'), schema, { message: "Погано" }),
    ).resolves.toEqual({
      name: "Пальто",
    });
  });

  it("uses `message` for broken JSON", async () => {
    await expect(
      readJson(request("{oops"), schema, { message: "Некоректний JSON" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Некоректний JSON",
    });
  });

  it("uses `invalidMessage` for failed validation, or the schema's message when exposed", async () => {
    const body = '{"name":"x"}';
    await expect(
      readJson(request(body), schema, {
        message: "JSON",
        invalidMessage: "Перевірте дані",
      }),
    ).rejects.toMatchObject({ message: "Перевірте дані" });
    await expect(
      readJson(request(body), schema, { message: "JSON", exposeIssue: true }),
    ).rejects.toMatchObject({ message: "Назва закоротка" });
  });

  it("can insist on a JSON content type", async () => {
    const plain = new Request("https://pontos.test/x", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });
    await expect(
      readJson(plain, schema, { message: "x", requireJsonContentType: true }),
    ).rejects.toMatchObject({ status: 415 });
  });
});

describe("assertSameOrigin()", () => {
  it("allows same-origin and origin-less requests", () => {
    expect(() =>
      assertSameOrigin(request("{}", { origin: "https://pontos.test" })),
    ).not.toThrow();
    expect(() => assertSameOrigin(request("{}"))).not.toThrow();
  });

  it("blocks cross-site requests", () => {
    expect(() =>
      assertSameOrigin(request("{}", { origin: "https://evil.test" })),
    ).toThrow(expect.objectContaining({ status: 403 }));
  });
});
