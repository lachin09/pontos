const hryvniaFormatter = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "UAH",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
});

export function formatPrice(amount: number): string {
  return hryvniaFormatter.format(amount);
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(value instanceof Date ? value : new Date(value));
}

export function formatItemCount(count: number): string {
  const remainder = count % 100;
  const lastDigit = count % 10;
  const unit =
    remainder >= 11 && remainder <= 14
      ? "товарів"
      : lastDigit === 1
        ? "товар"
        : lastDigit >= 2 && lastDigit <= 4
          ? "товари"
          : "товарів";

  return `${count} ${unit}`;
}
