import { describe, expect, it } from "vitest";
import {
  categoryGender,
  parseGender,
  shortCategoryName,
} from "@/lib/catalog/gender";

describe("categoryGender", () => {
  it("reads the line from the slug", () => {
    expect(categoryGender({ slug: "cholovichi-parky", name: "Парки" })).toBe(
      "men",
    );
    expect(categoryGender({ slug: "zhinochi-palta", name: "Пальта" })).toBe(
      "women",
    );
  });

  it("falls back to the name", () => {
    expect(categoryGender({ slug: "coats", name: "Жіночі пальта" })).toBe(
      "women",
    );
  });

  it("returns undefined for shared categories", () => {
    expect(
      categoryGender({ slug: "accessories", name: "Аксесуари" }),
    ).toBeUndefined();
  });
});

describe("parseGender", () => {
  it("accepts only known lines", () => {
    expect(parseGender("men")).toBe("men");
    expect(parseGender("kids")).toBeUndefined();
    expect(parseGender(undefined)).toBeUndefined();
  });
});

describe("shortCategoryName", () => {
  it("drops the line prefix and capitalises", () => {
    expect(shortCategoryName("Чоловічі шкіряні куртки")).toBe("Шкіряні куртки");
    expect(shortCategoryName("Жіночі еко-шуби")).toBe("Еко-шуби");
    expect(shortCategoryName("Аксесуари")).toBe("Аксесуари");
  });
});
