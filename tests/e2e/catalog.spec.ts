import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { productCardLinks, productGrid } from "./helpers";

/** Opens the filter form that is visible for this viewport. */
async function visibleFilterForm(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByText("Фільтри та сортування").click();
  }
  const sizeSelect = page
    .getByLabel("Розмір", { exact: true })
    .filter({ visible: true });
  await expect(sizeSelect).toHaveCount(1);
  return {
    sizeSelect,
    submit: page
      .getByRole("button", { name: "Показати товари" })
      .filter({ visible: true }),
  };
}

test.describe("catalog", () => {
  test("lists product cards and the matching count", async ({ page }) => {
    await page.goto("/catalog");

    await expect(
      page.getByRole("heading", { level: 1, name: "Каталог" }),
    ).toBeVisible();
    const cards = productGrid(page).getByRole("article");
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    await expect(
      page.getByText(new RegExp(`^${count} товар(и|ів)?$`)),
    ).toBeVisible();

    const firstLink = productCardLinks(page).first();
    await expect(firstLink).toHaveAttribute("href", /^\/product\/.+/);
  });

  test("a category pill filters by category and is marked current", async ({
    page,
  }) => {
    await page.goto("/catalog");
    await expect(productGrid(page).getByRole("article").first()).toBeVisible();
    const pills = page
      .getByRole("navigation", { name: "Категорії" })
      .getByRole("link");
    const pillCount = await pills.count();
    test.skip(pillCount < 2, "No active categories in the store");

    await expect(pills.first()).toHaveText("Усі");
    await expect(pills.first()).toHaveAttribute("aria-current", "page");

    const category = pills.nth(1);
    const categoryName = (await category.innerText()).trim();
    await category.click();

    await expect(page).toHaveURL(/[?&]category=[^&]+/);
    await expect(
      page.getByRole("heading", { level: 1, name: categoryName }),
    ).toBeVisible();
    const current = page
      .getByRole("navigation", { name: "Категорії" })
      .getByRole("link", { name: categoryName, exact: true });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(pills.first()).not.toHaveAttribute("aria-current", "page");
  });

  test("a size filter adds a removable chip", async ({ page, isMobile }) => {
    await page.goto("/catalog");
    const { sizeSelect, submit } = await visibleFilterForm(page, isMobile);

    const sizes = await sizeSelect
      .locator("option:not([disabled])")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value),
      );
    test.skip(sizes.length === 0, "No sizes in the store");
    const size = sizes[0];

    await sizeSelect.selectOption(size);
    await submit.click();

    await expect
      .poll(() => new URL(page.url()).searchParams.get("size"))
      .toBe(size);
    const chip = page
      .getByRole("list", { name: "Активні фільтри" })
      .getByRole("link", { name: `Прибрати фільтр: Розмір ${size}` });
    await expect(chip).toBeVisible();

    await chip.click();

    await expect
      .poll(() => new URL(page.url()).searchParams.has("size"))
      .toBe(false);
    await expect(
      page.getByRole("list", { name: "Активні фільтри" }),
    ).toHaveCount(0);
  });

  test("shows the empty state when nothing matches", async ({ page }) => {
    await page.goto("/catalog?minPrice=999999999");

    await expect(
      page.getByRole("heading", { name: "Нічого не знайдено" }),
    ).toBeVisible();
    await expect(productGrid(page).getByRole("article")).toHaveCount(0);

    await page.getByRole("link", { name: "Очистити фільтри" }).click();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(productGrid(page).getByRole("article").first()).toBeVisible();
  });
});
