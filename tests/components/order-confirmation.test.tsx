import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderConfirmation } from "@/components/checkout/order-confirmation";

const base = {
  orderNumber: 1042,
  total: 3000,
  paymentStatus: "pending" as const,
};

describe("OrderConfirmation", () => {
  it("offers Telegram updates when the bot is set up", () => {
    render(
      <OrderConfirmation
        confirmation={{
          ...base,
          telegramUrl: "https://t.me/pontos_bot?start=o_abc",
        }}
      />,
    );
    const link = screen.getByRole("link", {
      name: /Отримати підтвердження в Telegram/,
    });
    expect(link).toHaveAttribute("href", "https://t.me/pontos_bot?start=o_abc");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/реквізити для оплати/)).toBeInTheDocument();
  });

  it("shows the bank details and payment reference for a transfer", () => {
    render(
      <OrderConfirmation
        confirmation={{
          ...base,
          telegramUrl: null,
          bankDetails: "ФОП Магеррамов Сахіл\nIBAN UA00 0000 0000",
        }}
      />,
    );
    expect(screen.getByText("Реквізити для оплати")).toBeInTheDocument();
    expect(screen.getByText(/IBAN UA00 0000 0000/)).toBeInTheDocument();
    expect(screen.getByText(/вкажіть: замовлення №1042/)).toBeInTheDocument();
    expect(
      screen.queryByText(/узгодимо з вами телефоном/),
    ).not.toBeInTheDocument();
  });

  it("congratulates the first customer and shows the discount", () => {
    render(
      <OrderConfirmation
        confirmation={{
          ...base,
          subtotal: 10000,
          discountPercent: 30,
          discountAmount: 3000,
          total: 7000,
          telegramUrl: null,
        }}
      />,
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      /Ви наш перший покупець/,
    );
    expect(screen.getByText(/Знижка −30%/)).toBeInTheDocument();
    expect(screen.getByText("−3 000 ₴")).toBeInTheDocument();
    expect(screen.getByText("7 000 ₴")).toBeInTheDocument();
  });

  it("falls back to the phone note when there are no bank details", () => {
    render(<OrderConfirmation confirmation={{ ...base, telegramUrl: null }} />);
    expect(screen.getByText(/узгодимо з вами телефоном/)).toBeInTheDocument();
  });

  it("hides the Telegram block without a link", () => {
    render(
      <OrderConfirmation
        confirmation={{
          ...base,
          paymentStatus: "cash_on_delivery",
          telegramUrl: null,
        }}
      />,
    );
    expect(screen.queryByText(/Telegram/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Продовжити покупки/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("#1042")).toBeInTheDocument();
  });
});
