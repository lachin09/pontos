import { describe, expect, it } from "vitest";
import {
  shortAddress,
  showroomAddress,
  showroomMapHref,
} from "@/lib/content/showroom";
import { EMPTY_STORE_INFO } from "@/lib/validators/store-info";

const seller = {
  ...EMPTY_STORE_INFO.seller,
  address: "ст. м. Лісова, вул. Якова Гніздовського, 1А",
  addressRu: "ст. м. Лесная, ул. Якова Гнездовского, 1А",
  addressEn: "Lisova metro station, 1A Yakova Hnizdovskoho St",
};

describe("showroomAddress", () => {
  it("returns the address in the visitor's language", () => {
    expect(showroomAddress(seller, "uk")).toBe(seller.address);
    expect(showroomAddress(seller, "ru")).toBe(seller.addressRu);
    expect(showroomAddress(seller, "en")).toBe(seller.addressEn);
  });

  it("falls back to the Ukrainian address when a translation is empty", () => {
    expect(showroomAddress({ ...seller, addressEn: " " }, "en")).toBe(
      seller.address,
    );
  });
});

describe("showroomMapHref", () => {
  it("prefers the admin's map link", () => {
    expect(
      showroomMapHref({ ...seller, mapUrl: "https://maps.app.goo.gl/abc" }),
    ).toBe("https://maps.app.goo.gl/abc");
  });

  it("searches Google Maps for the Ukrainian address otherwise", () => {
    expect(showroomMapHref(seller)).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(seller.address)}`,
    );
  });

  it("is undefined without an address", () => {
    expect(showroomMapHref(EMPTY_STORE_INFO.seller)).toBeUndefined();
  });
});

describe("shortAddress", () => {
  it("drops a trailing landmark in parentheses", () => {
    expect(shortAddress("вул. Якова Гніздовського, 1А (ТРЦ «Даринок»)")).toBe(
      "вул. Якова Гніздовського, 1А",
    );
  });

  it("keeps addresses without one", () => {
    expect(shortAddress("вул. Хрещатик, 1")).toBe("вул. Хрещатик, 1");
    expect(shortAddress("(ТРЦ «Даринок»)")).toBe("(ТРЦ «Даринок»)");
  });
});
