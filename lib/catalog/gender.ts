/**
 * The store splits its catalog into men's and women's lines. Categories carry
 * no gender column, so it is read from the category itself: slugs are
 * transliterated from names that start with "Чоловічі" / "Жіночі".
 */
export const GENDERS = [
  { value: "men", label: "Чоловікам" },
  { value: "women", label: "Жінкам" },
] as const;

export type Gender = (typeof GENDERS)[number]["value"];

export function parseGender(value: string | undefined): Gender | undefined {
  return GENDERS.find((gender) => gender.value === value)?.value;
}

export function categoryGender(category: {
  slug: string;
  name: string;
}): Gender | undefined {
  const slug = category.slug.toLowerCase();
  const name = category.name.trim().toLocaleLowerCase("uk");
  if (slug.startsWith("cholovich") || name.startsWith("чоловіч")) return "men";
  if (slug.startsWith("zhinoch") || name.startsWith("жіноч")) return "women";
  return undefined;
}

/** "Чоловічі шкіряні куртки" → "Шкіряні куртки" once the line is chosen. */
export function shortCategoryName(name: string): string {
  const short = name.replace(/^(чоловічі|жіночі)\s+/iu, "");
  return short.charAt(0).toLocaleUpperCase("uk") + short.slice(1);
}
