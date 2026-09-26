import { describe, expect, it } from "vitest";
import { INFO_PAGE_TEMPLATES } from "@/lib/content/store-info-templates";
import {
  EMPTY_STORE_INFO,
  INFO_PAGE_SLUGS,
  isInfoPageSlug,
  storeInfoSchema,
} from "@/lib/validators/store-info";

describe("store info", () => {
  it("accepts the empty default", () => {
    expect(storeInfoSchema.safeParse(EMPTY_STORE_INFO).success).toBe(true);
  });

  it("has a template for every page", () => {
    for (const slug of INFO_PAGE_SLUGS) {
      expect(INFO_PAGE_TEMPLATES[slug].trim().length).toBeGreaterThan(50);
    }
  });

  it("accepts templates as page text", () => {
    const info = { ...EMPTY_STORE_INFO, pages: { ...INFO_PAGE_TEMPLATES } };
    expect(storeInfoSchema.safeParse(info).success).toBe(true);
  });

  it("allows an empty e-mail but rejects a malformed one", () => {
    const withEmail = (email: string) => ({
      ...EMPTY_STORE_INFO,
      seller: { ...EMPTY_STORE_INFO.seller, email },
    });
    expect(storeInfoSchema.safeParse(withEmail("")).success).toBe(true);
    expect(storeInfoSchema.safeParse(withEmail("shop@pontos.ua")).success).toBe(
      true,
    );
    const bad = storeInfoSchema.safeParse(withEmail("not-an-email"));
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.message).toBe("Вкажіть коректну пошту");
  });

  it("rejects a missing page", () => {
    const { offer: _removed, ...pages } = EMPTY_STORE_INFO.pages;
    void _removed;
    expect(
      storeInfoSchema.safeParse({ ...EMPTY_STORE_INFO, pages }).success,
    ).toBe(false);
  });

  it("recognises page slugs", () => {
    expect(isInfoPageSlug("offer")).toBe(true);
    expect(isInfoPageSlug("toString")).toBe(false);
    expect(isInfoPageSlug("unknown")).toBe(false);
  });
});
