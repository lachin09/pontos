import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import type { CheckoutData } from "@/lib/validators/checkout";

function renderForm(initialData: CheckoutData | null = null) {
  const onValid = vi.fn();
  const user = userEvent.setup();
  render(<CheckoutForm initialData={initialData} onValid={onValid} />);
  return { user, onValid };
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /Перевірити замовлення/ }));

async function fillDomestic(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Ім’я"), "  Олена ");
  await user.type(screen.getByLabelText("Прізвище"), "Коваль");
  await user.type(screen.getByLabelText("Телефон"), "+380971234567");
  await user.type(screen.getByLabelText("Місто"), "Київ");
  await user.type(
    screen.getByLabelText("Відділення, поштомат або адреса"),
    "Відділення №12",
  );
}

describe("CheckoutForm", () => {
  it("shows Ukrainian errors and does not continue when empty", async () => {
    const { user, onValid } = renderForm();
    await submit(user);
    expect(
      await screen.findByText("Ім’я: введіть щонайменше 2 символи"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Введіть коректний номер телефону з кодом країни"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Вкажіть відділення або адресу"),
    ).toBeInTheDocument();
    expect(onValid).not.toHaveBeenCalled();
  });

  it("links error messages to their fields for screen readers", async () => {
    const { user } = renderForm();
    await submit(user);
    const phone = screen.getByLabelText("Телефон");
    await screen.findByText("Введіть коректний номер телефону з кодом країни");
    expect(phone).toHaveAttribute("aria-invalid", "true");
    expect(phone).toHaveAccessibleDescription(
      "Введіть коректний номер телефону з кодом країни",
    );
  });

  it("passes clean, trimmed data on", async () => {
    const { user, onValid } = renderForm();
    await fillDomestic(user);
    await user.click(
      screen.getByRole("radio", { name: /Оплата при отриманні/ }),
    );
    await submit(user);
    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: "Олена",
        phone: "+380971234567",
        deliveryMethod: "nova_poshta",
        deliveryAddress: "Відділення №12",
        paymentMethod: "cash_on_delivery",
      }),
    );
  });

  it("changes the address prompt for each carrier", async () => {
    const { user } = renderForm();
    await user.selectOptions(
      screen.getByLabelText("Спосіб доставки"),
      "courier",
    );
    expect(screen.getByLabelText("Адреса доставки")).toBeInTheDocument();
  });

  describe("abroad", () => {
    it("asks for a postal code and only offers Nova Post", async () => {
      const { user } = renderForm();
      await user.selectOptions(
        screen.getByLabelText("Спосіб доставки"),
        "ukrposhta",
      );
      await user.selectOptions(screen.getByLabelText("Країна доставки"), "PL");

      const method =
        screen.getByLabelText<HTMLSelectElement>("Спосіб доставки");
      expect(method.value).toBe("nova_poshta");
      expect([...method.options].map((option) => option.value)).toEqual([
        "nova_poshta",
      ]);
      expect(screen.getByLabelText("Поштовий індекс")).toBeInTheDocument();
    });

    it("blocks submission without a postal code", async () => {
      const { user, onValid } = renderForm();
      await fillDomestic(user);
      await user.selectOptions(screen.getByLabelText("Країна доставки"), "PL");
      await submit(user);
      expect(
        await screen.findByText("Вкажіть поштовий індекс"),
      ).toBeInTheDocument();
      expect(onValid).not.toHaveBeenCalled();
    });
  });

  it("restores previously entered details", () => {
    renderForm({
      firstName: "Олена",
      lastName: "Коваль",
      phone: "+380971234567",
      city: "Львів",
      deliveryCountryCode: "UA",
      deliveryPostalCode: "",
      deliveryMethod: "ukrposhta",
      deliveryAddress: "Відділення 79000",
      paymentMethod: "cash_on_delivery",
      comment: "Дзвоніть після 18:00",
    });
    expect(screen.getByLabelText("Місто")).toHaveValue("Львів");
    expect(screen.getByLabelText("Відділення або адреса")).toHaveValue(
      "Відділення 79000",
    );
    expect(
      screen.getByRole("radio", { name: /Оплата при отриманні/ }),
    ).toBeChecked();
  });
});
