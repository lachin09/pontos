import type { CategoryTextField, Translations } from "@/lib/i18n/content";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  /** Russian / English text; Ukrainian is in the fields above. */
  translations: Translations<CategoryTextField>;
  createdAt: string;
  updatedAt: string;
}
