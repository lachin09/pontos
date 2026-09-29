const LETTER_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "7XL",
];

// XXL and 2XL are the same size under two names.
const letterRank = (size: string) => {
  const upper = size.trim().toUpperCase();
  return LETTER_SIZES.indexOf(upper === "XXL" ? "2XL" : upper);
};

/**
 * Orders sizes the way a shopper reads them: letter sizes from XS up to 7XL,
 * then numeric (European) sizes ascending, then anything else alphabetically.
 */
export function compareSizes(a: string, b: string): number {
  const rankA = letterRank(a);
  const rankB = letterRank(b);
  if (rankA !== -1 || rankB !== -1) {
    if (rankA === -1) return 1;
    if (rankB === -1) return -1;
    return rankA - rankB;
  }
  const numberA = Number(a);
  const numberB = Number(b);
  const isNumberA = a.trim() !== "" && Number.isFinite(numberA);
  const isNumberB = b.trim() !== "" && Number.isFinite(numberB);
  if (isNumberA && isNumberB) return numberA - numberB;
  if (isNumberA) return -1;
  if (isNumberB) return 1;
  return a.localeCompare(b, "uk");
}
