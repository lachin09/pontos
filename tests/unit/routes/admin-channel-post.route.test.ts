import { beforeEach, describe, expect, it, vi } from "vitest";
import { conflict } from "@/lib/errors";

const getActiveAdminSession = vi.fn();
const channel = { announce: vi.fn(), post: vi.fn() };
vi.mock("@/lib/supabase/admin-session", () => ({ getActiveAdminSession }));
vi.mock("@/lib/server/admin-services", () => ({
  createAdminServices: () => ({ channel }),
}));

const { POST } =
  await import("@/app/api/admin/products/[id]/channel-post/route");

const request = (body: unknown) =>
  new Request("https://pontos.test/api/admin/products/p1/channel-post", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const params = { params: Promise.resolve({ id: "p1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  getActiveAdminSession.mockResolvedValue({ supabase: {}, userId: "admin" });
});

describe("POST /api/admin/products/[id]/channel-post", () => {
  it("after a save, reports whether the product was announced", async () => {
    channel.announce.mockResolvedValue(false);
    const response = await POST(request({ force: false }), params);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ posted: false });
    expect(channel.announce).toHaveBeenCalledWith("p1");
    expect(channel.post).not.toHaveBeenCalled();
  });

  it("posts on demand and passes the service's reason through", async () => {
    channel.post.mockResolvedValueOnce(undefined);
    const posted = await POST(request({ force: true }), params);
    await expect(posted.json()).resolves.toEqual({ posted: true });
    expect(channel.announce).not.toHaveBeenCalled();

    channel.post.mockRejectedValueOnce(conflict("Канал не підключено."));
    const refused = await POST(request({ force: true }), params);
    expect(refused.status).toBe(409);
    await expect(refused.json()).resolves.toEqual({
      error: "Канал не підключено.",
    });
  });

  it("rejects a malformed body and anonymous callers", async () => {
    expect((await POST(request({}), params)).status).toBe(400);
    getActiveAdminSession.mockResolvedValue(null);
    expect((await POST(request({ force: true }), params)).status).toBe(401);
    expect(channel.post).not.toHaveBeenCalled();
  });
});
