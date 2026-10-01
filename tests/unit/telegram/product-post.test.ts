import { describe, expect, it } from "vitest";
import {
  albumPhotos,
  productPostCaption,
  type PostableProduct,
} from "@/lib/telegram/product-post";
import { makeVariant } from "../../support/factories";

const SITE = "https://shop.test";
const plain = (text: string) => text.replace(/\s/g, " ");

function product(overrides: Partial<PostableProduct> = {}): PostableProduct {
  return {
    name: "Жакет у ялинку",
    slug: "zhaket-u-yalynku",
    description:
      "Двобортний жакет у класичну ялинку.\n\n- Широкі лацкани\n\nСезон: демісезон",
    price: 4500,
    oldPrice: null,
    variants: [
      makeVariant({ size: "L", color: "Чорний" }),
      makeVariant({ size: "S", color: "Чорний" }),
      makeVariant({ size: "M", color: "Бежевий" }),
    ],
    ...overrides,
  };
}

describe("productPostCaption", () => {
  it("shows the name, the first paragraph, price, stock and the product link", () => {
    expect(plain(productPostCaption(product(), SITE))).toBe(
      [
        "<b>Жакет у ялинку</b>",
        "",
        "Двобортний жакет у класичну ялинку.",
        "",
        "Ціна: <b>4 500 ₴</b>",
        "Розміри: S, M, L",
        "Кольори: Чорний, Бежевий",
        "",
        '<a href="https://shop.test/product/zhaket-u-yalynku">Переглянути на сайті</a>',
      ]
        .join("\n")
        .replace(/\n/g, " "),
    );
  });

  it("strikes through the old price of a discounted product", () => {
    const text = plain(productPostCaption(product({ oldPrice: 6000 }), SITE));
    expect(text).toContain("Ціна: <s>6 000 ₴</s> <b>4 500 ₴</b>");
  });

  it("lists only what is in stock, in the singular for one option", () => {
    const text = productPostCaption(
      product({
        variants: [
          makeVariant({ size: "M", color: "Чорний" }),
          makeVariant({ size: "L", color: "Бежевий", stock: 0 }),
          makeVariant({ size: "XL", color: "Синій", isAvailable: false }),
        ],
      }),
      SITE,
    );
    expect(text).toContain("Розмір: M\nКолір: Чорний\n");
  });

  it("leaves sizes and colours out when everything is sold out", () => {
    const text = productPostCaption(
      product({ variants: [makeVariant({ stock: 0 })] }),
      SITE,
    );
    expect(text).not.toContain("Розмір");
    expect(text).not.toContain("Колір");
  });

  it("escapes text typed in the admin", () => {
    const text = productPostCaption(
      product({ name: "Пальто <b>&", description: "1 < 2" }),
      SITE,
    );
    expect(text).toContain("<b>Пальто &lt;b&gt;&amp;</b>");
    expect(text).toContain("1 &lt; 2");
  });

  it("has no link when the site address is unknown", () => {
    expect(productPostCaption(product(), null)).not.toContain("<a ");
  });

  it("shortens a long description at a word and stays within Telegram's limit", () => {
    const text = productPostCaption(
      product({ description: "слово ".repeat(400) }),
      SITE,
    );
    expect(text).toContain("слово…");
    expect(text.length).toBeLessThanOrEqual(1024);
  });
});

describe("albumPhotos", () => {
  const photos = (color: string | null, count: number) =>
    Array.from({ length: count }, (_, i) => ({
      url: `${color ?? "shared"}-${i + 1}`,
      color,
    }));

  it("uses every photo, in order, when they fit in one album", () => {
    const images = [...photos("Чорний", 3), ...photos(null, 2)];
    expect(albumPhotos(images)).toEqual(images.map((image) => image.url));
  });

  it("gives each colour its first photos when there are too many", () => {
    const images = [
      ...photos("Чорний", 5),
      ...photos("Бежевий", 5),
      ...photos("Оливковий", 5),
      ...photos("Синій", 5),
    ];
    expect(albumPhotos(images)).toEqual([
      "Чорний-1",
      "Чорний-2",
      "Чорний-3",
      "Бежевий-1",
      "Бежевий-2",
      "Бежевий-3",
      "Оливковий-1",
      "Оливковий-2",
      "Синій-1",
      "Синій-2",
    ]);
  });

  it("takes the first photos of a product with one colour", () => {
    expect(albumPhotos(photos("Чорний", 14))).toEqual(
      photos("Чорний", 10).map((image) => image.url),
    );
  });
});
