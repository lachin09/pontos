import { describe, expect, it } from "vitest";
import { CONTACT_LINKS_SETTING_KEY } from "@/lib/validators/contact-links";
import {
  EMPTY_STORE_INFO,
  STORE_INFO_SETTING_KEY,
} from "@/lib/validators/store-info";
import { createSettingsService } from "@/services/settings.service";
import { fakeSettings } from "../../support/fakes";

describe("settings service", () => {
  it("returns empty defaults before anything is saved", async () => {
    const service = createSettingsService(fakeSettings());
    await expect(service.getContactLinks()).resolves.toEqual([]);
    await expect(service.getStoreInfo()).resolves.toEqual(EMPTY_STORE_INFO);
  });

  it("round-trips store info", async () => {
    const repository = fakeSettings();
    const service = createSettingsService(repository);
    const info = {
      ...EMPTY_STORE_INFO,
      seller: { ...EMPTY_STORE_INFO.seller, legalName: "ФОП Коваль О. О." },
      pages: { ...EMPTY_STORE_INFO.pages, offer: "Текст оферти" },
    };
    await service.saveStoreInfo(info);
    expect(repository.values.has(STORE_INFO_SETTING_KEY)).toBe(true);
    await expect(service.getStoreInfo()).resolves.toEqual(info);
  });

  it("falls back to defaults when stored data is invalid", async () => {
    const service = createSettingsService(
      fakeSettings({
        [STORE_INFO_SETTING_KEY]: { seller: "broken" },
        [CONTACT_LINKS_SETTING_KEY]: { links: [{ type: "fax" }] },
      }),
    );
    await expect(service.getStoreInfo()).resolves.toEqual(EMPTY_STORE_INFO);
    await expect(service.getContactLinks()).resolves.toEqual([]);
  });
});
