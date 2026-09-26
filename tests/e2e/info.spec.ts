import { expect, test } from "./fixtures";

test.describe("info pages and footer", () => {
  test("an unknown info page shows not found", async ({ page }) => {
    await page.goto("/info/unknown-slug");

    // The route has a loading.tsx, so the response streams and Next.js can
    // only send a "soft" 404: status 200 plus a noindex robots tag.
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "Сторінку не знайдено" }),
    ).toBeVisible();
  });

  test("footer renders the shop links", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");

    await expect(footer).toContainText(
      `© ${new Date().getFullYear()} PONTOS. Усі права захищено.`,
    );
    const shopNav = footer.getByRole("navigation", { name: "Магазин" });
    for (const label of ["Каталог", "Категорії", "Новинки"]) {
      await expect(shopNav.getByRole("link", { name: label })).toBeVisible();
    }

    await shopNav.getByRole("link", { name: "Каталог" }).click();
    await expect(page).toHaveURL(/\/catalog$/);
  });

  test("published info pages linked from the footer open", async ({ page }) => {
    await page.goto("/");
    await expect(
      page
        .getByRole("contentinfo")
        .getByRole("navigation", { name: "Магазин" }),
    ).toBeVisible();
    const infoNav = page
      .getByRole("contentinfo")
      .getByRole("navigation", { name: "Покупцям" });
    const links = infoNav.getByRole("link");
    test.skip((await links.count()) === 0, "No info pages are published");

    const href = await links.first().getAttribute("href");
    expect(href).toMatch(/^\/info\/[a-z]+$/);
    const response = await page.goto(href ?? "/");

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("PONTOS · інформація")).toBeVisible();
  });
});
