import { describe, expect, it } from "vitest";
import { formatItemCount, formatPrice, pluralize } from "@/lib/utils/format";

// Intl separates thousands with a no-break space; compare on plain spaces.
const plain = (value: string) => value.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("formats hryvnias without decimals and with an explicit ₴", () => {
    expect(plain(formatPrice(1250))).toBe("1 250 ₴");
    expect(plain(formatPrice(999.6))).toBe("1 000 ₴");
    expect(formatPrice(0)).toBe("0 ₴");
  });
});

describe("pluralize", () => {
  const forms = ["товар", "товари", "товарів"] as const;

  it.each([
    [1, "товар"],
    [21, "товар"],
    [101, "товар"],
    [2, "товари"],
    [4, "товари"],
    [22, "товари"],
    [0, "товарів"],
    [5, "товарів"],
    [11, "товарів"],
    [12, "товарів"],
    [14, "товарів"],
    [111, "товарів"],
    [112, "товарів"],
  ])("uses the right form for %i", (count, expected) => {
    expect(pluralize(count, forms)).toBe(expected);
  });
});

describe("formatItemCount", () => {
  it("prefixes the count", () => {
    expect(formatItemCount(3)).toBe("3 товари");
    expect(formatItemCount(11)).toBe("11 товарів");
  });
});
