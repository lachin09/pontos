import { describe, expect, it } from "vitest";
import {
  customerLinkedMessage,
  escape,
  helpMessage,
  needsBankDetails,
  ownerNewOrderMessage,
  statusChangedMessage,
} from "@/lib/telegram/messages";
import { makeNotifiableOrder } from "../../support/factories";

const BANK = "IBAN: UA12 3456";
const plain = (text: string | null) => (text ?? "").replace(/\s/g, " ");

describe("escape", () => {
  it("neutralises HTML so customer text cannot inject markup", () => {
    expect(escape('<b>"x" & y</b>')).toBe('&lt;b&gt;"x" &amp; y&lt;/b&gt;');
  });
});

describe("customerLinkedMessage", () => {
  it("thanks the customer and lists the order", () => {
    const text = plain(customerLinkedMessage(makeNotifiableOrder(), BANK));
    expect(text).toContain("Дякуємо, Олена! Замовлення №1042");
    expect(text).toContain("• Пальто — Чорний, M × 1 — 3 000 ₴");
    expect(text).toContain("Доставка: Нова пошта · Відділення №12, Київ");
    expect(text).toContain("Оплата: Переказ на рахунок");
  });

  it("holds back bank details until the order is confirmed", () => {
    expect(customerLinkedMessage(makeNotifiableOrder(), BANK)).not.toContain(
      BANK,
    );
    expect(
      customerLinkedMessage(makeNotifiableOrder({ status: "confirmed" }), BANK),
    ).toContain(`${BANK}\nУ призначенні платежу вкажіть: замовлення №1042`);
  });

  it("names the country for international orders", () => {
    expect(
      customerLinkedMessage(
        makeNotifiableOrder({ deliveryCountryCode: "PL" }),
        "",
      ),
    ).toMatch(/Київ, \S+/);
  });

  it("escapes names and addresses", () => {
    const text = customerLinkedMessage(
      makeNotifiableOrder({ firstName: "<i>Ол</i>" }),
      "",
    );
    expect(text).toContain("&lt;i&gt;Ол&lt;/i&gt;");
  });
});

describe("needsBankDetails", () => {
  it("only for unpaid transfer orders that are confirmed or awaiting payment", () => {
    expect(needsBankDetails(makeNotifiableOrder({ status: "confirmed" }))).toBe(
      true,
    );
    expect(
      needsBankDetails(makeNotifiableOrder({ status: "payment_pending" })),
    ).toBe(true);
    expect(needsBankDetails(makeNotifiableOrder({ status: "new" }))).toBe(
      false,
    );
    expect(
      needsBankDetails(
        makeNotifiableOrder({
          status: "confirmed",
          paymentMethod: "cash_on_delivery",
        }),
      ),
    ).toBe(false);
    expect(
      needsBankDetails(
        makeNotifiableOrder({ status: "confirmed", paymentStatus: "paid" }),
      ),
    ).toBe(false);
  });
});

describe("statusChangedMessage", () => {
  const statusOnly = { status: true, paymentStatus: false };

  it("announces a confirmed transfer order with the bank details", () => {
    const text = statusChangedMessage(
      makeNotifiableOrder({ status: "confirmed" }),
      statusOnly,
      BANK,
    );
    expect(text).toContain("Замовлення №1042");
    expect(text).toContain("Замовлення підтверджено");
    expect(text).toContain(BANK);
  });

  it.each([
    ["shipped", "відправлено"],
    ["delivered", "доставлено"],
    ["cancelled", "скасовано"],
    ["processing", "Готуємо"],
  ] as const)("describes %s", (status, words) => {
    expect(
      statusChangedMessage(makeNotifiableOrder({ status }), statusOnly, ""),
    ).toContain(words);
  });

  it("says thanks when only the payment became paid", () => {
    const text = statusChangedMessage(
      makeNotifiableOrder({ status: "confirmed", paymentStatus: "paid" }),
      { status: false, paymentStatus: true },
      BANK,
    );
    expect(text).toContain("Оплату отримано");
    expect(text).not.toContain(BANK);
  });

  it("stays silent for changes a customer doesn't need", () => {
    expect(
      statusChangedMessage(
        makeNotifiableOrder({ status: "new" }),
        statusOnly,
        "",
      ),
    ).toBeNull();
    expect(
      statusChangedMessage(
        makeNotifiableOrder({ paymentStatus: "awaiting_confirmation" }),
        { status: false, paymentStatus: true },
        "",
      ),
    ).toBeNull();
  });
});

describe("owner and help messages", () => {
  it("gives the owner contact details and the comment", () => {
    const text = ownerNewOrderMessage(
      makeNotifiableOrder({ comment: "Дзвоніть після 18:00" }),
    );
    expect(text).toContain("Нове замовлення №1042");
    expect(text).toContain("Олена Коваль · +380971234567");
    expect(text).toContain("Коментар: Дзвоніть після 18:00");
  });

  it("offers the phone number when there is one", () => {
    expect(helpMessage("+380971234567")).toContain("+380971234567");
    expect(helpMessage("")).toContain("Контакти");
  });
});
