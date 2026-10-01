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

/** Sizes the admin product form offers as one-click choices. */
export const LETTER_SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
];
export const NUMERIC_SIZE_OPTIONS = [
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "56",
  "58",
  "60",
  "62",
  "64",
];

/** Sizes are typed by hand in the admin, so they match ignoring case. */
export function sameSize(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

const isStandardSize = (word: string) =>
  letterRank(word) !== -1 || /^\d+([.,]\d+)?$/.test(word);

/**
 * Splits typed sizes into labels: "6xl, 66" and "66 68" are two sizes each,
 * while a phrase such as "Один розмір" stays one. Letter sizes are upper-cased
 * and repeats are dropped.
 */
export function parseSizes(text: string): string[] {
  const labels = text.split(/[,;\n]/).flatMap((part) => {
    const words = part.trim().split(/\s+/).filter(Boolean);
    return words.every(isStandardSize)
      ? words.map((word) =>
          letterRank(word) === -1 ? word : word.toUpperCase(),
        )
      : [words.join(" ")];
  });
  return labels.filter(
    (label, index) =>
      labels.findIndex((other) => sameSize(other, label)) === index,
  );
}

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
