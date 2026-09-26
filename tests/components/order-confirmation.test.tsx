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
