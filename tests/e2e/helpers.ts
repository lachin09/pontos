import type { Locator, Page } from "@playwright/test";
import { expect } from "./fixtures";

const OUT_OF_STOCK = "немає в наявності";

/** The product grid on /catalog. */
export function productGrid(page: Page): Locator {
  return page.getByRole("region", { name: "Товари" });
}

/** Title links of the product cards on the current catalog page. */
export function productCardLinks(page: Page): Locator {
  return productGrid(page)
    .getByRole("article")
    .getByRole("heading")
    .getByRole("link");
}

/** The cart link in the site header. */
export function headerCartLink(page: Page): Locator {
  return page.getByRole("banner").getByRole("link", { name: /^Кошик/ });
}

/** Parses a formatted price such as "1 250 ₴" into comparable digits. */
export function priceDigits(text: string | null): number {
  const digits = (text ?? "").replace(/\D/g, "");
  if (!digits) throw new Error(`No price found in "${text}"`);
  return Number(digits);
}

/**
 * Clicks a toggle button until it reports aria-pressed="true". The first
 * click can land before React hydrates, in which case it does nothing.
 */
export async function pressUntilSelected(button: Locator) {
  await expect(async () => {
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true", {
      timeout: 1_000,
    });
  }).toPass({ timeout: 15_000 });
}

/**
 * Paths of in-stock catalog products with a non-zero price (at most `limit`),
 * so price arithmetic in the tests is meaningful.
 */
export async function availableProductPaths(page: Page, limit = 6) {
  await page.goto("/catalog?availability=available&minPrice=1");
  const links = productCardLinks(page);
  await expect(links.first()).toBeVisible();
  const hrefs = await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("href") ?? ""),
  );
  return hrefs.filter(Boolean).slice(0, limit);
}

/** The size buttons on a product page that are in stock for the current colour. */
export async function inStockSizeButtons(page: Page): Promise<Locator[]> {
  const group = page.getByRole("group", { name: /^Розмір/ });
  await expect(group).toBeVisible();
  const buttons = await group.getByRole("button").all();
  const inStock: Locator[] = [];
  for (const button of buttons) {
    const label = (await button.getAttribute("aria-label")) ?? "";
    if (!label.includes(OUT_OF_STOCK)) inStock.push(button);
  }
  return inStock;
}

/** The "added to cart" toast. */
export function addedToast(page: Page): Locator {
  return page.getByRole("status").filter({ hasText: "Додано до кошика" });
}

/**
 * Presses "Додати в кошик" until the confirmation toast shows. A click that
 * lands before hydration does nothing, so it is retried; a click after
 * hydration opens the toast immediately, so nothing is added twice.
 */
export async function clickAddToCart(page: Page) {
  const addButton = page.getByRole("button", {
    name: "Додати в кошик",
    exact: true,
  });
  await expect(async () => {
    await addButton.click();
    await expect(addedToast(page)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

export interface AddedItem {
  name: string;
  path: string;
}

/**
 * Opens in-stock products from the catalog and adds the first in-stock size
 * to the cart. With `minStock: 2` it only uses a variant whose quantity can be
 * increased, so cart tests can press "+".
 */
export async function addFirstInStockItem(
  page: Page,
  { minStock = 1 }: { minStock?: number } = {},
): Promise<AddedItem> {
  const paths = await availableProductPaths(page);
  expect(paths.length, "the catalog has in-stock products").toBeGreaterThan(0);

  for (const path of paths) {
    await page.goto(path);
    const name = (
      await page.getByRole("heading", { level: 1 }).innerText()
    ).trim();

    for (const size of await inStockSizeButtons(page)) {
      await pressUntilSelected(size);
      const addButton = page.getByRole("button", {
        name: "Додати в кошик",
        exact: true,
      });
      if (!(await addButton.isEnabled())) continue;
      if (minStock > 1) {
        const increase = page.getByRole("button", {
          name: "Збільшити кількість",
          exact: true,
        });
        if (!(await increase.isEnabled())) continue;
      }

      await clickAddToCart(page);
      return { name, path };
    }
  }

  throw new Error(
    `No in-stock variant with at least ${minStock} items found in the first ${paths.length} catalog products`,
  );
}
