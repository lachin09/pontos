import { beforeEach, describe, expect, it, vi } from "vitest";
import { conflict } from "@/lib/errors";
import type { CheckoutData } from "@/lib/validators/checkout";

const place = vi.fn();
const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("@/lib/server/storefront-services", () => ({
  getOrderPlacement: () => ({ place }),
}));

const { POST } = await import("@/app/api/orders/route");

const KEY = "0b6d3c54-9f7e-4c1a-8e39-2f0c1d7a5b11";
const customer: CheckoutData = {
  firstName: "Олена",
  lastName: "Коваль",
  phone: "+380971234567",
  city: "Київ",
  deliveryCountryCode: "UA",
  deliveryPostalCode: "",
  deliveryMethod: "nova_poshta",
  deliveryAddress: "Відділення №12",
  paymentMethod: "cash_on_delivery",
  comment: "",
};
const order = {
  customer,
  items: [{ variantId: "5f0f6c2e-1111-4a2b-9c3d-000000000001", quantity: 2 }],
};

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request("https://pontos.test/api/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": KEY,
        ...headers,
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    {},
  );
}

beforeEach(() => {
  place.mockReset();
  revalidateTag.mockReset();
});

describe("POST /api/orders", () => {
  it("places a new order, returns 201 and refreshes product stock", async () => {
    place.mockResolvedValue({
      orderNumber: 1042,
      total: 3000,
      paymentStatus: "cash_on_delivery",
      wasCreated: true,
    });
    const response = await post(order);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      orderNumber: 1042,
      total: 3000,
      paymentStatus: "cash_on_delivery",
    });
    expect(place).toHaveBeenCalledWith(order, KEY);
    expect(revalidateTag).toHaveBeenCalledWith("products", "max");
  });

  it("returns 200 without refreshing stock when the key was already used", async () => {
    place.mockResolvedValue({
      orderNumber: 1042,
      total: 3000,
      paymentStatus: "pending",
      wasCreated: false,
    });
    const response = await post(order);
    expect(response.status).toBe(200);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("passes the stock conflict message through", async () => {
    place.mockRejectedValue(conflict("На жаль, наявність товару змінилася."));
    const response = await post(order);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "На жаль, наявність товару змінилася.",
    });
  });

  it("hides unexpected failures behind a friendly 500", async () => {
    place.mockRejectedValue(new Error("connection reset"));
    const response = await post(order);
    expect(response.status).toBe(500);
    const { error } = await response.json();
    expect(error).toMatch(/^Не вдалося оформити замовлення/);
  });

  it.each([
    [
      "a non-JSON content type",
      () => post(order, { "content-type": "text/plain" }),
      415,
    ],
    [
      "a missing idempotency key",
      () => post(order, { "idempotency-key": "" }),
      400,
    ],
    [
      "a cross-site origin",
      () => post(order, { origin: "https://evil.test" }),
      403,
    ],
    ["broken JSON", () => post("{nope"), 400],
    ["an empty cart", () => post({ ...order, items: [] }), 400],
    [
      "duplicate variants",
      () => post({ ...order, items: [order.items[0], order.items[0]] }),
      400,
    ],
    [
      "invalid customer data",
      () => post({ ...order, customer: { ...customer, phone: "123" } }),
      400,
    ],
  ])("rejects %s without placing an order", async (_case, send, status) => {
    const response = await send();
    expect(response.status).toBe(status);
    expect(place).not.toHaveBeenCalled();
  });
});
