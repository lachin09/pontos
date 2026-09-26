import { describe, expect, it } from "vitest";
import { filterAndSortProducts } from "@/services/product.service";
import { makeProduct, makeVariant } from "../../support/factories";

const coat = makeProduct({
  name: "Пальто",
  categoryId: "outerwear",
  price: 3000,
  isFeatured: true,
  createdAt: "2026-01-01T00:00:00Z",
  variants: [makeVariant({ size: "M", color: "Чорний" })],
});
const jacket = makeProduct({
  name: "Куртка",
  categoryId: "outerwear",
  price: 2000,
  isNew: true,
  createdAt: "2026-03-01T00:00:00Z",
  variants: [makeVariant({ size: "L", color: "Бежевий", isAvailable: false })],
});
const bomber = makeProduct({
  name: "Бомбер",
  categoryId: "jackets",
  price: 1500,
  isAvailable: false,
  createdAt: "2026-02-01T00:00:00Z",
  variants: [makeVariant({ size: "S", color: "Зелений" })],
});
const all = () => [coat, jacket, bomber];
const names = (products: { name: string }[]) => products.map((p) => p.name);

describe("filterAndSortProducts", () => {
  it("filters by category", () => {
    expect(
      names(filterAndSortProducts(all(), { categoryId: "jackets" })),
    ).toEqual(["Бомбер"]);
  });

  it("filters by price range inclusively", () => {
    expect(
      names(
        filterAndSortProducts(all(), {
          minPrice: 2000,
          maxPrice: 3000,
          sort: "price-asc",
        }),
      ),
    ).toEqual(["Куртка", "Пальто"]);
  });

  it("matches size and colour case-insensitively on the same variant", () => {
    expect(
      names(filterAndSortProducts(all(), { size: "m", color: "чорний" })),
    ).toEqual(["Пальто"]);
    expect(
      filterAndSortProducts(all(), { size: "M", color: "Бежевий" }),
    ).toEqual([]);
  });

  it("with availableOnly, drops unavailable products and variants", () => {
    expect(
      names(
        filterAndSortProducts(all(), {
          availableOnly: true,
          sort: "price-asc",
        }),
      ),
    ).toEqual(["Куртка", "Пальто"]);
    // Куртка's only L variant is unavailable.
    expect(
      filterAndSortProducts(all(), { availableOnly: true, size: "L" }),
    ).toEqual([]);
  });

  it("sorts by price both ways", () => {
    expect(names(filterAndSortProducts(all(), { sort: "price-asc" }))).toEqual([
      "Бомбер",
      "Куртка",
      "Пальто",
    ]);
    expect(names(filterAndSortProducts(all(), { sort: "price-desc" }))).toEqual(
      ["Пальто", "Куртка", "Бомбер"],
    );
  });

  it("sorts newest with 'new' products first, then by date", () => {
    expect(names(filterAndSortProducts(all(), { sort: "newest" }))).toEqual([
      "Куртка",
      "Бомбер",
      "Пальто",
    ]);
  });

  it("defaults to featured first, then by name", () => {
    expect(names(filterAndSortProducts(all(), {}))).toEqual([
      "Пальто",
      "Бомбер",
      "Куртка",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = all();
    filterAndSortProducts(input, { sort: "price-asc" });
    expect(names(input)).toEqual(["Пальто", "Куртка", "Бомбер"]);
  });
});
