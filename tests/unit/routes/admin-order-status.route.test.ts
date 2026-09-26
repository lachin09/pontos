import { beforeEach, describe, expect, it, vi } from "vitest";

const getActiveAdminSession = vi.fn();
const orders = { getStatuses: vi.fn(), updateStatus: vi.fn() };
const notifyStatusChange = vi.fn();
vi.mock("@/lib/supabase/admin-session", () => ({ getActiveAdminSession }));
vi.mock("@/lib/server/admin-services", () => ({
  createAdminServices: () => ({ orders }),
}));
vi.mock("@/lib/server/storefront-services", () => ({
  notifyInBackground: (_label: string, task: (n: unknown) => unknown) =>
    task({ notifyStatusChange }),
}));

const { PATCH } = await import("@/app/api/admin/orders/[id]/route");

const ID = "3f2b1c9e-0000-4000-8000-000000000001";
const patch = (body: unknown) =>
  PATCH(
    new Request(`https://shop.test/api/admin/orders/${ID}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: ID }) },
  );

beforeEach(() => {
  vi.clearAllMocks();
  getActiveAdminSession.mockResolvedValue({ supabase: {}, userId: "admin" });
});

describe("PATCH /api/admin/orders/[id]", () => {
  it("updates the order and notifies with the statuses from before", async () => {
    orders.getStatuses.mockResolvedValue({
      status: "new",
      paymentStatus: "pending",
    });
    orders.updateStatus.mockResolvedValue(true);
    const response = await patch({
      status: "confirmed",
      paymentStatus: "pending",
    });
    expect(response.status).toBe(200);
    expect(orders.updateStatus).toHaveBeenCalledWith(
      ID,
      "confirmed",
      "pending",
    );
    expect(notifyStatusChange).toHaveBeenCalledWith(ID, {
      status: "new",
      paymentStatus: "pending",
    });
  });

  it("returns 404 and notifies nobody for an unknown order", async () => {
    orders.getStatuses.mockResolvedValue(null);
    orders.updateStatus.mockResolvedValue(false);
    const response = await patch({
      status: "confirmed",
      paymentStatus: "pending",
    });
    expect(response.status).toBe(404);
    expect(notifyStatusChange).not.toHaveBeenCalled();
  });

  it("rejects unknown statuses before touching the order", async () => {
    const response = await patch({
      status: "teleported",
      paymentStatus: "pending",
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Оберіть коректні статуси.",
    });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });
});
