import { describe, expect, it } from "vitest";
import { orderErrorMessage } from "@/components/checkout/use-place-order";
import { localizeCategory, localizeProduct } from "@/lib/i18n/catalog";
import { colorName } from "@/lib/i18n/colors";
import {
  localeFromAcceptLanguage,
  localizedPath,
  pluralForm,
  splitLocale,
} from "@/lib/i18n/config";
import {
  localizedText,
  parseTranslations,
  type Translations,
} from "@/lib/i18n/content";
import { fill, getDictionary } from "@/lib/i18n/dictionaries";
import { createCheckoutSchema } from "@/lib/validators/checkout";
import { makeProduct } from "../../support/factories";

/** Every leaf path of a nested dictionary, e.g. "cart.title". */
function paths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  return Object.entries(value as object).flatMap(([key, child]) =>
    paths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("dictionaries", () => {
  it("have the same keys in every language", () => {
    const uk = paths(getDictionary("uk")).sort();
    expect(paths(getDictionary("ru")).sort()).toEqual(uk);
    expect(paths(getDictionary("en")).sort()).toEqual(uk);
  });

  it("keep the same placeholders as Ukrainian", () => {
    const placeholders = (text: string) =>
      (text.match(/\{\w+\}/g) ?? []).sort().join();
    const flat = (dict: unknown, prefix = ""): [string, string][] =>
      typeof dict === "string"
        ? [[prefix, dict]]
        : Array.isArray(dict)
          ? []
          : Object.entries(dict as object).flatMap(([key, child]) =>
              flat(child, `${prefix}.${key}`),
            );
    const uk = Object.fromEntries(flat(getDictionary("uk")));
    for (const locale of ["ru", "en"] as const) {
      for (const [key, text] of flat(getDictionary(locale))) {
        expect(placeholders(text), `${locale}${key}`).toBe(
          placeholders(uk[key]),
        );
      }
    }
  });

  it("fills placeholders and leaves unknown ones", () => {
    expect(fill("Кошик, {count}", { count: "2 товари" })).toBe(
      "Кошик, 2 товари",
    );
    expect(fill("{a} {b}", { a: 1 })).toBe("1 {b}");
  });
});

describe("localizedPath / splitLocale", () => {
  it("keeps Ukrainian at the plain URL and prefixes the others", () => {
    expect(localizedPath("/catalog", "uk")).toBe("/catalog");
    expect(localizedPath("/catalog?size=M", "ru")).toBe("/ru/catalog?size=M");
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/", "uk")).toBe("/");
  });

  it("splits a public path into language and page", () => {
    expect(splitLocale("/ru/product/x")).toEqual({
      locale: "ru",
      path: "/product/x",
    });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/catalog")).toEqual({
      locale: "uk",
      path: "/catalog",
    });
  });
});

describe("localeFromAcceptLanguage", () => {
  it("picks the highest-ranked supported language", () => {
    expect(localeFromAcceptLanguage("ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(localeFromAcceptLanguage("en-GB,en;q=0.9")).toBe("en");
    expect(localeFromAcceptLanguage("de-DE,uk;q=0.8,ru;q=0.5")).toBe("uk");
    expect(localeFromAcceptLanguage("fr,ru;q=0.2,en;q=0.9")).toBe("en");
  });

  it("falls back to Ukrainian", () => {
    expect(localeFromAcceptLanguage(null)).toBe("uk");
    expect(localeFromAcceptLanguage("de,fr")).toBe("uk");
    expect(localeFromAcceptLanguage("ru;q=0")).toBe("uk");
  });
});

describe("pluralForm", () => {
  const forms = ["товар", "товари", "товарів"] as const;
  it("uses Slavic rules for Ukrainian and Russian", () => {
    expect(
      [1, 2, 5, 11, 21, 22, 25].map((n) => pluralForm("uk", n, forms)),
    ).toEqual([
      "товар",
      "товари",
      "товарів",
      "товарів",
      "товар",
      "товари",
      "товарів",
    ]);
  });
  it("uses one / other for English", () => {
    const en = ["item", "items", "items"] as const;
    expect(pluralForm("en", 1, en)).toBe("item");
    expect(pluralForm("en", 2, en)).toBe("items");
    expect(pluralForm("en", 21, en)).toBe("items");
  });
});

describe("catalogue translations", () => {
  it("keeps only known languages and non-empty strings", () => {
    expect(
      parseTranslations(
        { ru: { name: "Куртка", description: "  " }, de: { name: "x" }, en: 5 },
        ["name", "description"],
      ),
    ).toEqual({ ru: { name: "Куртка" } });
    expect(parseTranslations(null, ["name"])).toEqual({});
  });

  it("falls back to Ukrainian when a field is missing", () => {
    const translations: Translations<"name" | "description"> = {
      en: { name: "Jacket" },
    };
    expect(localizedText("Куртка", translations, "name", "en")).toBe("Jacket");
    expect(localizedText("Куртка", translations, "name", "ru")).toBe("Куртка");
    expect(localizedText("Опис", translations, "description", "en")).toBe(
      "Опис",
    );
  });

  it("localizes products and categories", () => {
    const product = makeProduct({
      name: "Куртка",
      description: "Опис",
      translations: { en: { name: "Jacket" } },
    });
    expect(localizeProduct(product, "en")).toMatchObject({
      name: "Jacket",
      description: "Опис",
    });
    expect(localizeProduct(product, "uk")).toBe(product);
    expect(
      localizeCategory(
        {
          id: "c",
          name: "Жіночі пальта",
          slug: "zhinochi-palta",
          description: "",
          imageUrl: null,
          sortOrder: 0,
          isActive: true,
          translations: { ru: { name: "Женские пальто" } },
          createdAt: "",
          updatedAt: "",
        },
        "ru",
      ).name,
    ).toBe("Женские пальто");
  });

  it("names colours in each language", () => {
    expect(colorName("чорний", "uk")).toBe("Чорний");
    expect(colorName("Чорний", "en")).toBe("Black");
    expect(colorName("Темно-синій", "ru")).toBe("Тёмно-синий");
    expect(colorName("Невідомий", "en")).toBe("Невідомий");
  });
});

describe("checkout messages", () => {
  it("validates with messages in the requested language", () => {
    const result = createCheckoutSchema("en").shape.city.safeParse("");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter your city");
  });

  it("translates known order errors and hides unknown ones", () => {
    const stock = getDictionary("uk").checkout.errors.stockChanged;
    expect(orderErrorMessage(stock, "uk")).toBe(stock);
    expect(orderErrorMessage(stock, "en")).toBe(
      getDictionary("en").checkout.errors.stockChanged,
    );
    expect(orderErrorMessage("Якась нова помилка", "ru")).toBe(
      getDictionary("ru").checkout.errors.failed,
    );
  });
});
