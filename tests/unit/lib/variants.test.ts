import { describe, expect, it } from "vitest";
import {
  defaultVariant,
  discountPercent,
  findVariant,
  imagesForColor,
  isInStock,
  primaryImageUrl,
  sameColor,
  sizeForColor,
  uniqueColors,
  uniqueSizes,
} from "@/lib/product/variants";
import { makeImage, makeProduct, makeVariant } from "../../support/factories";

describe("sameColor", () => {
  it("ignores case and surrounding spaces", () => {
    expect(sameColor(" Чорний ", "чорний")).toBe(true);
    expect(sameColor("Чорний", "Бежевий")).toBe(false);
  });

  it("treats a missing colour as empty", () => {
    expect(sameColor(null, "")).toBe(true);
    expect(sameColor(undefined, "Чорний")).toBe(false);
  });
});

describe("uniqueColors / uniqueSizes", () => {
  const variants = [
    makeVariant({ color: "Чорний", size: "S" }),
    makeVariant({ color: "Чорний", size: "M" }),
    makeVariant({ color: "Бежевий", size: "S" }),
  ];

  it("keeps one variant per colour in first-seen order", () => {
    expect(uniqueColors(variants).map((variant) => variant.color)).toEqual([
      "Чорний",
      "Бежевий",
    ]);
  });

  it("lists each size once", () => {
    expect(uniqueSizes(variants)).toEqual(["S", "M"]);
  });
});

describe("findVariant / isInStock", () => {
  const black = makeVariant({ color: "Чорний", size: "M" });
  const soldOut = makeVariant({ color: "Бежевий", size: "M", stock: 0 });
  const disabled = makeVariant({
    color: "Сірий",
    size: "M",
    isAvailable: false,
  });

  it("matches colour loosely and size exactly", () => {
    expect(findVariant([black], "чорний", "M")).toBe(black);
    expect(findVariant([black], "Чорний", "m")).toBeUndefined();
  });

  it("requires availability and stock", () => {
    expect(isInStock(black)).toBe(true);
    expect(isInStock(soldOut)).toBe(false);
    expect(isInStock(disabled)).toBe(false);
    expect(isInStock(undefined)).toBe(false);
  });
});

describe("defaultVariant", () => {
  it("prefers the first available variant", () => {
    const off = makeVariant({ isAvailable: false });
    const on = makeVariant();
    expect(defaultVariant([off, on])).toBe(on);
  });

  it("falls back to the first variant when none is available", () => {
    const off = makeVariant({ isAvailable: false });
    expect(defaultVariant([off])).toBe(off);
    expect(defaultVariant([])).toBeUndefined();
  });
});

describe("sizeForColor", () => {
  const variants = [
    makeVariant({ color: "Чорний", size: "S" }),
    makeVariant({ color: "Чорний", size: "M" }),
    makeVariant({ color: "Бежевий", size: "S", stock: 0 }),
    makeVariant({ color: "Бежевий", size: "L" }),
  ];

  it("keeps the current size when it is in stock in the new colour", () => {
    expect(sizeForColor(variants, "Чорний", "M")).toBe("M");
  });

  it("moves to the first in-stock size of the new colour", () => {
    expect(sizeForColor(variants, "Бежевий", "S")).toBe("L");
  });

  it("falls back to the first size of the colour when none is in stock", () => {
    const soldOut = [makeVariant({ color: "Сірий", size: "XS", stock: 0 })];
    expect(sizeForColor(soldOut, "Сірий", "M")).toBe("XS");
  });

  it("keeps the current size for an unknown colour", () => {
    expect(sizeForColor(variants, "Зелений", "M")).toBe("M");
  });
});

describe("imagesForColor", () => {
  const shared = makeImage({ color: null });
  const black = makeImage({ color: "Чорний" });
  const beige = makeImage({ color: "Бежевий" });
  const images = [shared, black, beige];

  it("returns every image when no colour is selected", () => {
    expect(imagesForColor(images, "")).toEqual(images);
  });

  it("puts the colour's photos first, then shared ones", () => {
    expect(imagesForColor(images, " чорний ")).toEqual([black, shared]);
  });

  it("uses shared photos when the colour has none", () => {
    expect(imagesForColor(images, "Сірий")).toEqual([shared]);
  });

  it("falls back to all photos when nothing matches or is shared", () => {
    expect(imagesForColor([black, beige], "Сірий")).toEqual([black, beige]);
  });
});

describe("primaryImageUrl", () => {
  it("picks the colour photo, then a shared one, then the first", () => {
    const shared = makeImage({ color: "" });
    const black = makeImage({ color: "Чорний" });
    const beige = makeImage({ color: "Бежевий" });
    expect(
      primaryImageUrl(makeProduct({ images: [shared, black] }), "Чорний"),
    ).toBe(black.url);
    expect(
      primaryImageUrl(makeProduct({ images: [black, shared] }), "Сірий"),
    ).toBe(shared.url);
    expect(primaryImageUrl(makeProduct({ images: [beige] }), "Сірий")).toBe(
      beige.url,
    );
    expect(primaryImageUrl(makeProduct({ images: [] }), "Сірий")).toBeNull();
  });
});

describe("discountPercent", () => {
  it("rounds the saving against the old price", () => {
    expect(discountPercent(750, 1000)).toBe(25);
    expect(discountPercent(666, 1000)).toBe(33);
  });

  it("is zero without an old price or when the price went up", () => {
    expect(discountPercent(1000, null)).toBe(0);
    expect(discountPercent(1200, 1000)).toBe(0);
  });
});
