import { describe, expect, it } from "vitest";
import {
  addSizes,
  colorsDraft,
  initialDraft,
  removeSize,
  toProductInput,
} from "@/components/admin/product-form/product-draft";
import type { ProductVariantDraft } from "@/components/admin/product-form/types";

const variant = (patch: Partial<ProductVariantDraft>): ProductVariantDraft => ({
  id: crypto.randomUUID(),
  sku: `SKU-${patch.color}-${patch.size}`,
  size: "M",
  color: "Чорний",
  color_hex: "#111111",
  price: "10000",
  stock: "2",
  is_available: true,
  ...patch,
});

describe("colorsDraft", () => {
  it("groups variants by colour and orders the sizes", () => {
    const colors = colorsDraft([
      variant({ size: "XL" }),
      variant({ size: "48", color: "Сірий", color_hex: "#888888" }),
      variant({ size: "M", color: " чорний " }),
    ]);

    expect(colors.map((color) => color.color)).toEqual(["Чорний", "Сірий"]);
    expect(colors[0].color_hex).toBe("#111111");
    expect(colors[0].sizes.map((size) => size.size)).toEqual(["M", "XL"]);
    expect(colors[1].sizes.map((size) => size.size)).toEqual(["48"]);
  });
});

describe("addSizes / removeSize", () => {
  it("adds only missing sizes, priced from the product, in size order", () => {
    const [{ sizes }] = colorsDraft([variant({ size: "L" })]);
    const next = addSizes(sizes, ["52", "l", "S"], "9500");

    expect(next.map((size) => size.size)).toEqual(["S", "L", "52"]);
    expect(next[0]).toMatchObject({ price: "9500", stock: "0" });
    expect(next[1]).toBe(sizes[0]);
    expect(new Set(next.map((size) => size.sku)).size).toBe(3);
  });

  it("removes a size ignoring case", () => {
    const [{ sizes }] = colorsDraft([
      variant({ size: "L" }),
      variant({ size: "XL" }),
    ]);
    expect(removeSize(sizes, "xl").map((size) => size.size)).toEqual(["L"]);
  });
});

describe("toProductInput", () => {
  it("saves every size of every colour as a variant", () => {
    const saved = variant({ size: "M" });
    const [black] = colorsDraft([saved]);
    const draft = {
      ...initialDraft([{ id: "category", name: "Куртки" }]),
      price: "10000",
      colors: [
        { ...black, color: " Графіт ", color_hex: "#333333" },
        {
          key: "new",
          color: "Сірий",
          color_hex: "#888888",
          sizes: addSizes([], ["48", "50"], "10000"),
        },
      ],
    };

    const { variants } = toProductInput(draft);

    expect(variants.map(({ color, size }) => `${color} ${size}`)).toEqual([
      "Графіт M",
      "Сірий 48",
      "Сірий 50",
    ]);
    expect(variants[0]).toMatchObject({
      id: saved.id,
      sku: saved.sku,
      color_hex: "#333333",
      price: 10000,
      stock: 2,
    });
    expect(variants[1]).not.toHaveProperty("id");
  });
});
