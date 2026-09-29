import type { Locale } from "@/lib/i18n/config";

/**
 * Colour names are typed in Ukrainian in the admin and stored on variants.
 * This maps the common ones for display; unknown colours show as typed.
 * Keys are lower-case Ukrainian.
 */
const COLORS: Record<string, { ru: string; en: string }> = {
  айворі: { ru: "Айвори", en: "Ivory" },
  бежевий: { ru: "Бежевый", en: "Beige" },
  "бежево-сірий": { ru: "Бежево-серый", en: "Taupe" },
  "бежево-сірий (тауп)": { ru: "Бежево-серый (тауп)", en: "Taupe" },
  білий: { ru: "Белый", en: "White" },
  бордовий: { ru: "Бордовый", en: "Burgundy" },
  еспресо: { ru: "Эспрессо", en: "Espresso" },
  зелений: { ru: "Зелёный", en: "Green" },
  карамельний: { ru: "Карамельный", en: "Caramel" },
  коричневий: { ru: "Коричневый", en: "Brown" },
  леопардовий: { ru: "Леопардовый", en: "Leopard" },
  молочний: { ru: "Молочный", en: "Milk white" },
  "молочно-бежевий": { ru: "Молочно-бежевый", en: "Cream beige" },
  оливковий: { ru: "Оливковый", en: "Olive" },
  помаранчевий: { ru: "Оранжевый", en: "Orange" },
  "пудрово-рожевий": { ru: "Пудрово-розовый", en: "Dusty pink" },
  рожевий: { ru: "Розовый", en: "Pink" },
  синій: { ru: "Синий", en: "Blue" },
  сірий: { ru: "Серый", en: "Grey" },
  "сірий вінтаж": { ru: "Серый винтаж", en: "Vintage grey" },
  "темно-коричневий": { ru: "Тёмно-коричневый", en: "Dark brown" },
  "темно-синій": { ru: "Тёмно-синий", en: "Navy" },
  "темно-смарагдовий": { ru: "Тёмно-изумрудный", en: "Dark emerald" },
  хакі: { ru: "Хаки", en: "Khaki" },
  чорний: { ru: "Чёрный", en: "Black" },
  "чорно-молочний": { ru: "Чёрно-молочный", en: "Black and cream" },
};

export function colorName(color: string, locale: Locale): string {
  const trimmed = color.trim();
  if (locale === "uk") {
    // Admins sometimes type colours in lower case; show them capitalised.
    return trimmed.charAt(0).toLocaleUpperCase("uk") + trimmed.slice(1);
  }
  return COLORS[trimmed.toLocaleLowerCase("uk")]?.[locale] ?? trimmed;
}
