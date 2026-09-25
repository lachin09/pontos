import type { Product, ProductImage, ProductVariant } from "@/types/product";

interface ProductSeed {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  description: string;
  composition?: string;
  careInstructions?: string;
  colors: { name: string; code: string }[];
  images: [string, string];
  sizes?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isUnavailable?: boolean;
}

const imageUrl = (photoId: string) => `https://images.unsplash.com/${photoId}`;

const stockLevels = [5, 2, 8, 0, 3, 6, 1, 4];
const createdAt = "2025-08-20T10:00:00.000Z";
const productCompositions: Record<string, string> = {
  "product-001": "100% бавовна",
  "product-002": "100% бавовна",
  "product-003": "80% бавовна, 20% поліестер",
  "product-004": "80% бавовна, 20% поліестер",
  "product-005": "98% бавовна, 2% еластан",
  "product-006": "55% льон, 45% бавовна",
  "product-007": "100% бавовна",
  "product-008": "95% бавовна, 5% еластан",
  "product-009": "100% бавовна",
  "product-010": "100% бавовна",
};

const seeds: ProductSeed[] = [
  {
    id: "product-001",
    name: "Футболка Daily",
    slug: "daily-t-shirt",
    categoryId: "category-tshirts",
    price: 890,
    description: "Щільна бавовняна футболка вільного крою з м’якою фактурою.",
    colors: [
      { name: "Молочний", code: "#e8e2d7" },
      { name: "Чорний", code: "#292923" },
    ],
    images: [
      "photo-1521572163474-6864f9cf17ab",
      "photo-1523398002811-999ca8dec234",
    ],
    isFeatured: true,
    isNew: true,
  },
  {
    id: "product-002",
    name: "Футболка Heavyweight",
    slug: "heavyweight-t-shirt",
    categoryId: "category-tshirts",
    price: 1090,
    description: "Модель із важкої бавовни, що добре тримає форму.",
    colors: [
      { name: "Графіт", code: "#555650" },
      { name: "Білий", code: "#f5f4ef" },
    ],
    images: [
      "photo-1576566588028-4147f3842f27",
      "photo-1503342217505-b0a15ec3261c",
    ],
    isUnavailable: true,
  },
  {
    id: "product-003",
    name: "Світшот Weekend",
    slug: "weekend-sweatshirt",
    categoryId: "category-sweatshirts",
    price: 1890,
    description:
      "М’який світшот із начосом для повільних вихідних і міських прогулянок.",
    colors: [
      { name: "Оливковий", code: "#77765b" },
      { name: "Молочний", code: "#e8e2d7" },
    ],
    images: ["photo-1556821840-3a63f95609a7", "photo-1556821840-4a63f95609a7"],
    isFeatured: true,
  },
  {
    id: "product-004",
    name: "Худі Form",
    slug: "form-hoodie",
    categoryId: "category-sweatshirts",
    price: 2290,
    oldPrice: 2690,
    description: "Об’ємне худі з капюшоном і кишенею-кенгуру.",
    colors: [
      { name: "Темно-синій", code: "#343f50" },
      { name: "Сірий", code: "#aaa9a2" },
    ],
    images: ["photo-1556821840-3a63f95609a7", "photo-1556821840-4a63f95609a7"],
    isNew: true,
  },
  {
    id: "product-005",
    name: "Штани Straight",
    slug: "straight-trousers",
    categoryId: "category-bottoms",
    price: 1990,
    description: "Прямі штани зі зручним поясом і глибокими кишенями.",
    colors: [
      { name: "Чорний", code: "#292923" },
      { name: "Хакі", code: "#77765b" },
    ],
    images: [
      "photo-1542272604-787c3835535d",
      "photo-1594633312681-425c7b97ccd1",
    ],
    isFeatured: true,
  },
  {
    id: "product-006",
    name: "Сорочка Linen Blend",
    slug: "linen-blend-shirt",
    categoryId: "category-shirts",
    price: 1790,
    description: "Легка сорочка з фактурної суміші льону та бавовни.",
    colors: [
      { name: "Блакитний", code: "#a8bac2" },
      { name: "Пісочний", code: "#c6b89f" },
    ],
    images: [
      "photo-1598033129183-c4f50c736f10",
      "photo-1603252109303-2751441dd157",
    ],
    isNew: true,
  },
  {
    id: "product-007",
    name: "Куртка Utility",
    slug: "utility-jacket",
    categoryId: "category-shirts",
    price: 3490,
    oldPrice: 3990,
    description:
      "Легка бавовняна куртка з накладними кишенями та металевою фурнітурою.",
    colors: [
      { name: "Хакі", code: "#77765b" },
      { name: "Темно-синій", code: "#343f50" },
    ],
    images: ["photo-1551028719-00167b16eac5", "photo-1548126032-079a0fb0099d"],
  },
  {
    id: "product-008",
    name: "Сукня Rib",
    slug: "rib-knit-dress",
    categoryId: "category-shirts",
    price: 2190,
    description: "Лаконічна трикотажна сукня з м’якої тканини в рубчик.",
    colors: [
      { name: "Шоколадний", code: "#725448" },
      { name: "Чорний", code: "#292923" },
    ],
    images: [
      "photo-1595777457583-95e059d581b8",
      "photo-1566174053879-31528523f8ae",
    ],
    isFeatured: true,
  },
  {
    id: "product-009",
    name: "Кепка Everyday",
    slug: "everyday-cap",
    categoryId: "category-accessories",
    price: 690,
    description: "Бавовняна кепка з регульованою застібкою ззаду.",
    colors: [
      { name: "Чорний", code: "#292923" },
      { name: "Пісочний", code: "#c6b89f" },
    ],
    images: [
      "photo-1588850561407-ed78c282e89b",
      "photo-1521369909029-2afed882baee",
    ],
    sizes: ["OS"],
  },
  {
    id: "product-010",
    name: "Сумка Canvas",
    slug: "canvas-tote-bag",
    categoryId: "category-accessories",
    price: 790,
    description:
      "Містка сумка з щільної бавовняної тканини для щоденних справ.",
    colors: [
      { name: "Натуральний", code: "#d7cbb5" },
      { name: "Чорний", code: "#292923" },
    ],
    images: [
      "photo-1590874103328-eac38a683ce7",
      "photo-1544816155-12df9643f363",
    ],
    sizes: ["OS"],
    isNew: true,
  },
];

function createProduct(seed: ProductSeed): Product {
  const sizes = seed.sizes ?? ["S", "M", "L", "XL"];
  const variants: ProductVariant[] = seed.colors.flatMap((color, colorIndex) =>
    sizes.map((size, sizeIndex) => {
      const stock = seed.isUnavailable
        ? 0
        : stockLevels[
            (colorIndex * sizes.length +
              sizeIndex +
              Number(seed.id.slice(-1))) %
              stockLevels.length
          ];
      const variantId = `${seed.id}-variant-${colorIndex + 1}-${sizeIndex + 1}`;

      return {
        id: variantId,
        productId: seed.id,
        sku: `${seed.slug.toUpperCase()}-${colorIndex + 1}-${size}`,
        size,
        color: color.name,
        colorHex: color.code,
        price: seed.price,
        stock,
        isAvailable: stock > 0,
        createdAt,
        updatedAt: createdAt,
      };
    }),
  );
  const images: ProductImage[] = seed.images.map((photoId, index) => ({
    id: `${seed.id}-image-${index + 1}`,
    productId: seed.id,
    color: seed.colors[index]?.name ?? null,
    url: imageUrl(photoId),
    alt: `${seed.name}, фото ${index + 1}`,
    sortOrder: index + 1,
    createdAt,
  }));

  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    description: seed.description,
    composition:
      seed.composition ?? productCompositions[seed.id] ?? "100% бавовна",
    careInstructions:
      seed.careInstructions ?? "Делікатне прання при 30 °C. Не відбілювати.",
    categoryId: seed.categoryId,
    price: seed.price,
    oldPrice: seed.oldPrice ?? null,
    images,
    variants,
    isAvailable: variants.some((variant) => variant.isAvailable),
    isFeatured: seed.isFeatured ?? false,
    isNew: seed.isNew ?? false,
    isSale: Boolean(seed.oldPrice && seed.oldPrice > seed.price),
    createdAt,
    updatedAt: createdAt,
  };
}

export const mockProducts: Product[] = seeds.map(createProduct);
