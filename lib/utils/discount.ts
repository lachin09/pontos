/** The first-customer discount on an items total, rounded like the database. */
export function discountAmount(subtotal: number, percent: number) {
  return Math.round(subtotal * percent) / 100;
}
