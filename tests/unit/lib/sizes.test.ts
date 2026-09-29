import { describe, expect, it } from "vitest";
import { compareSizes } from "@/lib/product/sizes";

describe("compareSizes", () => {
  it("orders letter sizes from small to large", () => {
    expect(
      ["3XL", "L", "XS", "M", "7XL", "XL", "S", "2XL"].sort(compareSizes),
    ).toEqual(["XS", "S", "M", "L", "XL", "2XL", "3XL", "7XL"]);
  });

  it("treats XXL as 2XL and ignores case", () => {
    expect(["3xl", "XXL", "l"].sort(compareSizes)).toEqual(["l", "XXL", "3xl"]);
  });

  it("orders numeric sizes numerically, after letter sizes", () => {
    expect(["60", "48", "M", "52", "100"].sort(compareSizes)).toEqual([
      "M",
      "48",
      "52",
      "60",
      "100",
    ]);
  });

  it("puts unknown labels last", () => {
    expect(["Один розмір", "50", "L"].sort(compareSizes)).toEqual([
      "L",
      "50",
      "Один розмір",
    ]);
  });
});
