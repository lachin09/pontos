import { expect, test } from "./fixtures";

test.describe("languages", () => {
  test("the switcher moves between languages and the choice sticks", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "The top-bar switcher is hidden on phones");
    await page.goto("/catalog");
    await expect(page.locator("html")).toHaveAttribute("lang", "uk-UA");

    const switcher = page.getByRole("navigation", { name: "Мова сайту" });
    await switcher.getByRole("link", { name: "EN" }).click();

    await expect(page).toHaveURL(/\/en\/catalog$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { level: 1, name: "Catalogue" }),
    ).toBeVisible();

    // A plain URL now opens in English because the choice is remembered.
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/en\/cart$/);

    await page
      .getByRole("navigation", { name: "Site language" })
      .getByRole("link", { name: "UA" })
      .click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "uk-UA");
  });

  test("a first visit follows the browser language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "ru-RU" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ru-UA");
    await expect(
      page.getByRole("heading", { level: 1, name: "Кожа и мех" }),
    ).toBeVisible();
    await context.close();
  });

  test("product pages show the translated name and keep the language in links", async ({
    page,
  }) => {
    await page.goto("/en/catalog");
    const firstCard = page
      .getByRole("region", { name: "Products" })
      .getByRole("article")
      .getByRole("heading")
      .getByRole("link")
      .first();
    await expect(firstCard).toHaveAttribute("href", /^\/en\/product\/.+/);
    const name = (await firstCard.textContent())?.trim() ?? "";
    await firstCard.click();

    await expect(page).toHaveURL(/\/en\/product\/.+/);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Add to cart|Out of stock/ }),
    ).toBeVisible();
  });
});
