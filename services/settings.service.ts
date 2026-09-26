import {
  CONTACT_LINKS_SETTING_KEY,
  contactLinksSchema,
  type ContactLinkRecord,
  type ContactLinksInput,
} from "@/lib/validators/contact-links";
import {
  EMPTY_STORE_INFO,
  STORE_INFO_SETTING_KEY,
  storeInfoSchema,
  type StoreInfo,
} from "@/lib/validators/store-info";
import {
  EMPTY_TELEGRAM_SETTINGS,
  TELEGRAM_SETTING_KEY,
  telegramSettingsSchema,
  type TelegramSettings,
} from "@/lib/validators/telegram";
import type { SettingsRepository } from "@/repositories/settings.repository";

/** Typed access to each store setting. */
export function createSettingsService(settings: SettingsRepository) {
  return {
    async getContactLinks(): Promise<ContactLinkRecord[]> {
      const { links } = await settings.get(
        CONTACT_LINKS_SETTING_KEY,
        contactLinksSchema,
        { links: [] },
      );
      return links;
    },
    saveContactLinks: (links: ContactLinksInput) =>
      settings.save(CONTACT_LINKS_SETTING_KEY, links),

    getStoreInfo: (): Promise<StoreInfo> =>
      settings.get(STORE_INFO_SETTING_KEY, storeInfoSchema, EMPTY_STORE_INFO),
    saveStoreInfo: (info: StoreInfo) =>
      settings.save(STORE_INFO_SETTING_KEY, info),

    getTelegramSettings: (): Promise<TelegramSettings> =>
      settings.get(
        TELEGRAM_SETTING_KEY,
        telegramSettingsSchema,
        EMPTY_TELEGRAM_SETTINGS,
      ),
    saveTelegramSettings: (value: TelegramSettings) =>
      settings.save(TELEGRAM_SETTING_KEY, value),
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
