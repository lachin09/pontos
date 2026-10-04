import { z } from "zod";

export const STORE_INFO_SETTING_KEY = "store_info";

/**
 * The information pages the store publishes. Adding a page means adding an
 * entry here; the admin editor, footer and /info/[slug] route follow.
 */
export const INFO_PAGES = {
  about: { title: "Про магазин", footer: "Про нас" },
  delivery: { title: "Доставка й оплата", footer: "Доставка й оплата" },
  returns: { title: "Обмін та повернення", footer: "Обмін та повернення" },
  offer: { title: "Публічна оферта", footer: "Публічна оферта" },
  privacy: {
    title: "Політика конфіденційності",
    footer: "Конфіденційність",
  },
} as const;

export type InfoPageSlug = keyof typeof INFO_PAGES;
export const INFO_PAGE_SLUGS = Object.keys(INFO_PAGES) as InfoPageSlug[];

export function isInfoPageSlug(value: string): value is InfoPageSlug {
  // hasOwn, not `in`: "toString" and friends must not count as pages.
  return Object.hasOwn(INFO_PAGES, value);
}

const text = (max: number) => z.string().trim().max(max);

export const sellerSchema = z.object({
  legalName: text(200),
  taxId: text(20),
  address: text(300),
  /** The showroom address in the other storefront languages; empty falls back to `address`. */
  addressRu: text(300).default(""),
  addressEn: text(300).default(""),
  /** Where the address links to; empty means a Google Maps search for `address`. */
  mapUrl: z
    .union([z.literal(""), z.url("Вкажіть коректне посилання").max(500)])
    .default(""),
  email: z.union([z.literal(""), z.email("Вкажіть коректну пошту").max(200)]),
  phone: text(40),
  workingHours: text(200),
  /** Sent to bank-transfer customers by the Telegram bot; not shown on the site. */
  bankDetails: text(1000).default(""),
});

export const storeInfoSchema = z.object({
  seller: sellerSchema,
  pages: z.object(
    Object.fromEntries(
      INFO_PAGE_SLUGS.map((slug) => [
        slug,
        text(30000).describe(INFO_PAGES[slug].title),
      ]),
    ) as Record<InfoPageSlug, ReturnType<typeof text>>,
  ),
});

export type SellerInfo = z.infer<typeof sellerSchema>;
export type StoreInfo = z.infer<typeof storeInfoSchema>;

export const EMPTY_STORE_INFO: StoreInfo = {
  seller: {
    legalName: "",
    taxId: "",
    address: "",
    addressRu: "",
    addressEn: "",
    mapUrl: "",
    email: "",
    phone: "",
    workingHours: "",
    bankDetails: "",
  },
  pages: Object.fromEntries(
    INFO_PAGE_SLUGS.map((slug) => [slug, ""]),
  ) as Record<InfoPageSlug, string>,
};
