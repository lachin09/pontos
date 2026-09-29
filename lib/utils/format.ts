const hryvniaFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
});

export function formatPrice(amount: number): string {
  // Currency display differs between Node and browsers (`грн` vs `₴`).
  // Keep the symbol explicit so server-rendered and hydrated text match.
  return `${hryvniaFormatter.format(amount)} ₴`;
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(value instanceof Date ? value : new Date(value));
}

/** Picks the Ukrainian plural form: [1 товар, 2 товари, 5 товарів]. */
export function pluralize(
  count: number,
  [one, few, many]: readonly [string, string, string],
): string {
  const remainder = count % 100;
  const lastDigit = count % 10;
  if (remainder >= 11 && remainder <= 14) return many;
  if (lastDigit === 1) return one;
  if (lastDigit >= 2 && lastDigit <= 4) return few;
  return many;
}

export function formatItemCount(count: number): string {
  return `${count} ${pluralize(count, ["товар", "товари", "товарів"])}`;
}

/** Digits of a phone number in international form: 0971234567 → 380971234567. */
export function normalizePhoneDigits(value: string): string {
  const enteredDigits = value.replace(/\D/g, "");
  if (enteredDigits.startsWith("00")) return enteredDigits.slice(2);
  if (enteredDigits.startsWith("0") && enteredDigits.length === 10) {
    return `38${enteredDigits}`;
  }
  return enteredDigits;
}

export function telHref(value: string): string {
  return `tel:+${normalizePhoneDigits(value)}`;
}
