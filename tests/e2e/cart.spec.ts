import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addFirstInStockItem, headerCartLink, priceDigits } from "./helpers";

/** The "Разом за товари" amount in the cart summary. */
async function cartTotal(page: Page) {
  const row = page
    .getByText("Разом за товари", { exact: true })
    .first()
    .locator("xpath=..");
  return priceDigits(await row.innerText());
}

test.describe("cart", () => {
  test("shows the empty state when nothing was added", async ({ page }) => {
    await page.goto("/cart");

    await expect(
      page.getByRole("heading", { level: 1, name: "Кошик поки порожній" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "До каталогу" }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test("increasing the quantity increases the subtotal", async ({ page }) => {
    const item = await addFirstInStockItem(page, { minStock: 2 });
    await page.goto("/cart");

    const lines = page.getByRole("list", { name: "Товари в кошику" });
    await expect(lines.getByRole("listitem")).toHaveCount(1);
    await expect(lines).toContainText(item.name);
    const quantity = lines.getByRole("status", { name: "Кількість" });
    await expect(quantity).toHaveText("1");
    await expect(page.getByText("Товари (1)")).toBeVisible();
    const before = await cartTotal(page);
    expect(before).toBeGreaterThan(0);

    await lines
      .getByRole("button", { name: `Збільшити кількість ${item.name}` })
      .click();

    await expect(quantity).toHaveText("2");
    await expect(page.getByText("Товари (2)")).toBeVisible();
    await expect.poll(() => cartTotal(page)).toBe(before * 2);
    await expect(headerCartLink(page)).toHaveAccessibleName("Кошик, 2 товари");

    await lines
      .getByRole("button", { name: `Зменшити кількість ${item.name}` })
      .click();
    await expect(quantity).toHaveText("1");
    await expect.poll(() => cartTotal(page)).toBe(before);
  });

  test("clearing the cart asks for confirmation", async ({ page }) => {
    await addFirstInStockItem(page);
    await page.goto("/cart");
    const lines = page.getByRole("list", { name: "Товари в кошику" });
    await expect(lines.getByRole("listitem")).toHaveCount(1);
    const clearButton = page.getByRole("button", { name: "Очистити кошик" });

    // Dismissing the dialog keeps the items.
    const dismissed = page.waitForEvent("dialog").then(async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toBe("Видалити всі товари з кошика?");
      await dialog.dismiss();
    });
    await clearButton.click();
    await dismissed;
    await expect(lines.getByRole("listitem")).toHaveCount(1);

    // Accepting it empties the cart.
    page.once("dialog", (dialog) => void dialog.accept());
    await clearButton.click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Кошик поки порожній" }),
    ).toBeVisible();
    await expect(headerCartLink(page)).toHaveAccessibleName("Кошик");
  });
});
