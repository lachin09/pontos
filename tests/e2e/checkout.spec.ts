import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { addFirstInStockItem } from "./helpers";

const customer = {
  firstName: "Тестовий",
  lastName: "Покупець",
  phone: "+380501234567",
  city: "Київ",
  address: "Відділення №12",
};

async function openCheckoutWithItem(page: Page) {
  await addFirstInStockItem(page);
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { level: 1, name: "Оформлення замовлення" }),
  ).toBeVisible();
}

function reviewButton(page: Page) {
  return page.getByRole("button", { name: "Перевірити замовлення" });
}

test.describe("checkout", () => {
  test("with an empty cart shows Кошик порожній", async ({ page }) => {
    await page.goto("/checkout");

    await expect(
      page.getByRole("heading", { level: 1, name: "Кошик порожній" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "До каталогу" })).toBeVisible();
  });

  test("submitting the empty form shows validation errors", async ({
    page,
  }) => {
    await openCheckoutWithItem(page);

    await reviewButton(page).click();

    for (const label of ["Ім’я", "Прізвище", "Телефон", "Місто"]) {
      await expect(page.getByLabel(label, { exact: true })).toHaveAttribute(
        "aria-invalid",
        "true",
      );
    }
    await expect(
      page.getByText("Ім’я: введіть щонайменше 2 символи"),
    ).toBeVisible();
    await expect(
      page.getByText("Введіть коректний номер телефону з кодом країни"),
    ).toBeVisible();
    await expect(page.getByText("Вкажіть місто")).toBeVisible();
    await expect(page.getByText("Вкажіть відділення або адресу")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Перевірте дані" }),
    ).toHaveCount(0);
  });

  test("a country outside Ukraine asks for a postcode and allows only Нова пошта", async ({
    page,
  }) => {
    await openCheckoutWithItem(page);
    const country = page.getByLabel("Країна доставки");
    const method = page.getByLabel("Спосіб доставки");

    await expect(country).toHaveValue("UA");
    await expect(method.locator("option")).toHaveText([
      "Нова пошта",
      "Укрпошта",
      "Кур’єр",
    ]);
    await expect(page.getByLabel("Поштовий індекс")).toHaveCount(0);

    await method.selectOption("courier");
    await country.selectOption("PL");

    await expect(page.getByLabel("Поштовий індекс")).toBeVisible();
    await expect(method.locator("option")).toHaveText(["Нова пошта"]);
    await expect(method).toHaveValue("nova_poshta");
  });

  test("valid details go to review and can be edited again", async ({
    page,
  }) => {
    await openCheckoutWithItem(page);

    await page.getByLabel("Ім’я", { exact: true }).fill(customer.firstName);
    await page.getByLabel("Прізвище").fill(customer.lastName);
    await page.getByLabel("Телефон").fill(customer.phone);
    await page.getByLabel("Місто").fill(customer.city);
    await page
      .getByLabel("Відділення, поштомат або адреса")
      .fill(customer.address);
    await page.getByLabel("Оплата при отриманні").check();
    await reviewButton(page).click();

    const review = page.getByRole("region", { name: "Перевірте дані" });
    await expect(review).toBeVisible();
    await expect(review).toContainText(
      `${customer.firstName} ${customer.lastName}`,
    );
    await expect(review).toContainText(customer.phone);
    await expect(review).toContainText(`${customer.city}, Україна`);
    await expect(review).toContainText(`Нова пошта · ${customer.address}`);
    await expect(review).toContainText("Оплата при отриманні");
    // The order is never confirmed in e2e tests; the button is only checked.
    await expect(
      review.getByRole("button", { name: /^Підтвердити замовлення/ }),
    ).toBeEnabled();

    await review.getByRole("button", { name: "Змінити дані" }).click();

    await expect(review).toBeHidden();
    await expect(page.getByLabel("Ім’я", { exact: true })).toHaveValue(
      customer.firstName,
    );
    await expect(page.getByLabel("Прізвище")).toHaveValue(customer.lastName);
    await expect(page.getByLabel("Телефон")).toHaveValue(customer.phone);
    await expect(page.getByLabel("Місто")).toHaveValue(customer.city);
    await expect(
      page.getByLabel("Відділення, поштомат або адреса"),
    ).toHaveValue(customer.address);
    await expect(page.getByLabel("Оплата при отриманні")).toBeChecked();
  });
});
