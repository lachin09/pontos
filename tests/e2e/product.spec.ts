import { expect, test } from "./fixtures";
import {
  addedToast,
  availableProductPaths,
  clickAddToCart,
  headerCartLink,
  inStockSizeButtons,
  pressUntilSelected,
  productCardLinks,
} from "./helpers";

test.describe("product page", () => {
  test("opens from the catalog with a breadcrumb", async ({ page }) => {
    await page.goto("/catalog");
    const firstCard = productCardLinks(page).first();
    const productName = (await firstCard.innerText()).trim();

    await firstCard.click();

    await expect(page).toHaveURL(/\/product\/.+/);
    await expect(
      page.getByRole("heading", { level: 1, name: productName }),
    ).toBeVisible();
    const breadcrumb = page.getByRole("navigation", {
      name: "Навігаційний ланцюжок",
    });
    await expect(
      breadcrumb.getByRole("link", { name: "Каталог" }),
    ).toBeVisible();
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
      productName,
    );
    await expect(page.getByRole("group", { name: /^Розмір/ })).toBeVisible();
  });

  test("adds an in-stock size to the cart", async ({ page }) => {
    const [path] = await availableProductPaths(page, 1);
    await page.goto(path);
    await expect(headerCartLink(page)).toHaveAccessibleName("Кошик");

    const [size] = await inStockSizeButtons(page);
    expect(size, "an in-stock size for the default colour").toBeDefined();
    const sizeLabel = (await size.getAttribute("aria-label")) ?? "";
    await pressUntilSelected(size);
    await expect(page.getByRole("group", { name: /^Розмір/ })).toContainText(
      `— ${sizeLabel}`,
    );

    await clickAddToCart(page);

    const toast = addedToast(page);
    await expect(toast).toContainText(sizeLabel);
    const toCart = toast.getByRole("link", { name: "Перейти до кошика" });
    await expect(toCart).toHaveAttribute("href", "/cart");
    await expect(headerCartLink(page)).toHaveAccessibleName("Кошик, 1 товар");
    await expect(headerCartLink(page)).toContainText("1");

    // The toast closes after 4 s, so a covered link must fail fast. On
    // desktop this currently fails: the toast sits in the product column's
    // `lg:sticky` stacking context, underneath the sticky site header.
    await toCart.click({ timeout: 3_000 });
    await expect(page).toHaveURL(/\/cart$/);
    await expect(
      page.getByRole("list", { name: "Товари в кошику" }).getByRole("listitem"),
    ).toHaveCount(1);
  });
});

test("an unknown product shows Товар не знайдено", async ({ page }) => {
  await page.goto("/product/this-product-does-not-exist");

  await expect(
    page.getByRole("heading", { level: 1, name: "Товар не знайдено" }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page.getByRole("link", { name: "Перейти до каталогу" }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});

test.describe("mobile sticky buy bar", () => {
  test.skip(({ isMobile }) => !isMobile, "The buy bar is phone-only");

  test("appears when the main buttons scroll away and asks for a size first", async ({
    page,
  }) => {
    const [path] = await availableProductPaths(page, 1);
    await page.goto(path);
    const sizes = page.getByRole("group", { name: /^Розмір/ });
    await expect(sizes).toBeVisible();
    const sizeCount = await sizes.getByRole("button").count();
    const bar = page.locator("[data-sticky-bar]");
    const barAction = page.getByRole("button", {
      name: sizeCount > 1 ? "Обрати розмір" : "У кошик",
      exact: true,
    });

    // With the main add button on screen the bar is hidden (and inert).
    await page
      .getByRole("button", { name: "Додати в кошик", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("data-sticky-bar", "hidden");
    await expect(barAction).toHaveCount(0);

    // Scroll the main buttons out of view.
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("data-sticky-bar", "visible");
    await expect(barAction).toBeVisible();

    if (sizeCount > 1) {
      // "Обрати розмір" scrolls back up to the options.
      await barAction.click();
      await expect(
        page.getByRole("group", { name: /^Розмір/ }),
      ).toBeInViewport();
    }
  });
});
