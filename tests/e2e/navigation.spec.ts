import { expect, test } from "./fixtures";

test.describe("site navigation", () => {
  test("home page renders the hero and the header", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/PONTOS/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Щодня/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Знайти свою річ" }),
    ).toHaveAttribute("href", "/catalog");

    const header = page.getByRole("banner");
    await expect(
      header.getByRole("link", { name: "PONTOS — на головну" }),
    ).toBeVisible();
    await expect(
      header.getByRole("link", { name: "Кошик", exact: true }),
    ).toBeVisible();
  });

  test("skip link is the first tab stop and targets the main content", async ({
    page,
  }) => {
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: "Перейти до вмісту" });
    await expect(skipLink).toHaveAttribute("href", "#main");

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    await expect(page.locator("main#main")).toHaveCount(1);
  });

  test("unknown URL shows the Ukrainian 404 page", async ({ page }) => {
    const response = await page.goto("/ця-сторінка-не-існує");

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "Сторінку не знайдено" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "До каталогу" })).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
  });
});

test.describe("desktop header", () => {
  test.skip(({ isMobile }) => isMobile, "The header nav is hidden on phones");

  test("Каталог link opens the catalog and is marked current", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Головна навігація" });
    const catalogLink = nav.getByRole("link", { name: "Каталог" });
    await expect(catalogLink).not.toHaveAttribute("aria-current", "page");

    await catalogLink.click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Каталог" }),
    ).toBeVisible();
    await expect(catalogLink).toHaveAttribute("aria-current", "page");
  });
});

test.describe("mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "The menu button is phone-only");

  test("opens a drawer with the links and closes with Escape", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("navigation", { name: "Головна навігація" }),
    ).toBeHidden();

    const menuButton = page.getByRole("button", { name: "Відкрити меню" });
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(async () => {
      await menuButton.click();
      await expect(page.getByRole("dialog", { name: "Меню" })).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 15_000 });

    const drawer = page.getByRole("dialog", { name: "Меню" });
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    const nav = drawer.getByRole("navigation", { name: "Мобільна навігація" });
    for (const label of ["Каталог", "Категорії", "Новинки", "Про нас"]) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });

  test("a drawer link navigates and closes the menu", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.getByRole("button", { name: "Відкрити меню" });
    const drawer = page.getByRole("dialog", { name: "Меню" });
    await expect(async () => {
      await menuButton.click();
      await expect(drawer).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });

    await drawer
      .getByRole("navigation", { name: "Мобільна навігація" })
      .getByRole("link", { name: "Каталог" })
      .click();

    await expect(page).toHaveURL(/\/catalog$/);
    await expect(drawer).toBeHidden();
  });
});

test.describe("admin area", () => {
  test("/admin redirects anonymous visitors to the login page", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: "Вхід до адмінпанелі" }),
    ).toBeVisible();
    await expect(page.getByLabel("Електронна пошта")).toBeVisible();
    await expect(page.getByLabel("Пароль")).toBeVisible();
    await expect(page.getByRole("button", { name: "Увійти" })).toBeVisible();
  });
});
