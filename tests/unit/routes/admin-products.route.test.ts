import { beforeEach, describe, expect, it, vi } from "vitest";
import { conflict } from "@/lib/errors";

const getActiveAdminSession = vi.fn();
const revalidateStorefront = vi.fn();
const products = { create: vi.fn(), update: vi.fn(), remove: vi.fn() };
vi.mock("@/lib/supabase/admin-session", () => ({ getActiveAdminSession }));
vi.mock("@/lib/data/revalidate", () => ({ revalidateStorefront }));
vi.mock("@/lib/server/admin-services", () => ({
  createAdminServices: () => ({ products }),
}));

const collection = await import("@/app/api/admin/products/route");
const item = await import("@/app/api/admin/products/[id]/route");

const product = {
  category_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  name: "Пальто",
  slug: "palto",
  description: "",
  composition: "",
  care_instructions: "",
  price: 3000,
  old_price: null,
  is_published: true,
  is_available: true,
  is_featured: false,
  is_new: false,
  is_sale: false,
  variants: [
    {
      sku: "P-1",
      size: "M",
      color: "Чорний",
      color_hex: "#111111",
      price: 3000,
      stock: 3,
      is_available: true,
    },
  ],
};

const json = (method: string, body: unknown) =>
  new Request("https://pontos.test/api/admin/products", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  getActiveAdminSession.mockResolvedValue({ supabase: {}, userId: "admin" });
});

describe("admin product routes", () => {
  it("POST creates a product and refreshes the storefront", async () => {
    products.create.mockResolvedValue("new-id");
    const response = await collection.POST(json("POST", product), {});
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "new-id" });
    expect(revalidateStorefront).toHaveBeenCalledWith("products");
  });

  it("POST rejects invalid products with the validator's message", async () => {
    const response = await collection.POST(
      json("POST", { ...product, slug: "Not a slug" }),
      {},
    );
    expect(response.status).toBe(400);
    expect(products.create).not.toHaveBeenCalled();
    expect(revalidateStorefront).not.toHaveBeenCalled();
  });

  it("PUT passes service conflicts through unchanged", async () => {
    products.update.mockRejectedValue(
      conflict("Артикул або посилання такого товару вже існує."),
    );
    const response = await item.PUT(json("PUT", product), params("p1"));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Артикул або посилання такого товару вже існує.",
    });
    expect(revalidateStorefront).not.toHaveBeenCalled();
  });

  it("DELETE removes the product by id", async () => {
    const response = await item.DELETE(
      new Request("https://pontos.test/x", { method: "DELETE" }),
      params("p1"),
    );
    expect(response.status).toBe(200);
    expect(products.remove).toHaveBeenCalledWith("p1");
  });

  it("requires an admin session", async () => {
    getActiveAdminSession.mockResolvedValue(null);
    const response = await collection.POST(json("POST", product), {});
    expect(response.status).toBe(401);
    expect(products.create).not.toHaveBeenCalled();
  });
});
