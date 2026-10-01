import { describe, expect, it } from "vitest";
import {
  customerLinkedMessage,
  escape,
  helpMessage,
  needsBankDetails,
  ownerNewOrderMessage,
  ownerReceiptMessage,
  receiptNoOrderMessage,
  receiptReceivedMessage,
  statusChangedMessage,
  welcomeMessage,
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

  it("asks for the receipt along with the bank details", () => {
    expect(
      customerLinkedMessage(makeNotifiableOrder({ status: "confirmed" }), BANK),
    ).toContain("надішліть, будь ласка, фото або скриншот квитанції");
    expect(customerLinkedMessage(makeNotifiableOrder(), BANK)).not.toContain(
      "квитанції",
    );
  });

  it("writes to English and Russian customers in their language", () => {
    const en = plain(
      customerLinkedMessage(
        makeNotifiableOrder({ status: "confirmed", locale: "en" }),
        BANK,
      ),
    );
    expect(en).toContain("Thank you, Олена! Order No. 1042");
    expect(en).toContain("Delivery: Nova Poshta · Відділення №12, Київ");
    expect(en).toContain("Payment reference: order No. 1042");
    expect(en).toContain("send a photo or screenshot of the receipt");
    const ru = plain(customerLinkedMessage(makeNotifiableOrder({ locale: "ru" }), ""));
    expect(ru).toContain("Спасибо, Олена! Заказ №1042");
    expect(ru).toContain("Мы получили ваш заказ");
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

  it("explains an out-of-stock cancellation in the customer's language", () => {
    const cancelled = (locale: "uk" | "ru" | "en") =>
      statusChangedMessage(
        makeNotifiableOrder({ status: "cancelled", locale }),
        statusOnly,
        "",
        "out_of_stock",
      );
    expect(cancelled("uk")).toContain("вже немає в наявності");
    expect(cancelled("ru")).toContain("уже нет в наличии");
    expect(cancelled("en")).toContain("no longer in stock");
  });

  it("ignores the cancel reason for any other status", () => {
    expect(
      statusChangedMessage(
        makeNotifiableOrder({ status: "shipped" }),
        statusOnly,
        "",
        "out_of_stock",
      ),
    ).toContain("відправлено");
  });

  it("says thanks when only the payment became paid", () => {
    const text = statusChangedMessage(
      makeNotifiableOrder({ status: "confirmed", paymentStatus: "paid" }),
      { status: false, paymentStatus: true },
      BANK,
    );
    expect(text).toContain("оплату отримано");
    expect(text).toContain("Відправимо ваше замовлення якнайшвидше");
    expect(text).not.toContain(BANK);
  });

  it("speaks the customer's language", () => {
    const paid = { status: true, paymentStatus: true };
    expect(
      statusChangedMessage(
        makeNotifiableOrder({ status: "paid", paymentStatus: "paid", locale: "en" }),
        paid,
        "",
      ),
    ).toContain("Order No. 1042</b>\nThank you, payment received!");
    expect(
      statusChangedMessage(
        makeNotifiableOrder({ status: "shipped", locale: "ru" }),
        statusOnly,
        "",
      ),
    ).toContain("Заказ №1042</b>\nЗаказ отправлен");
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

  it("tells the owner whether to phone the customer", () => {
    expect(ownerNewOrderMessage(makeNotifiableOrder())).toContain(
      "Telegram: ❌ не підключено — зателефонуйте клієнту",
    );
    expect(
      ownerNewOrderMessage(makeNotifiableOrder({ telegramChatId: 555 })),
    ).toContain("Telegram: ✅ підключено");
  });

  it("tells the owner when the customer shops in another language", () => {
    expect(ownerNewOrderMessage(makeNotifiableOrder({ locale: "en" }))).toContain(
      "Мова клієнта: англійська",
    );
    expect(ownerNewOrderMessage(makeNotifiableOrder())).not.toContain("Мова");
  });

  it("captions a copied receipt for the owner in Ukrainian", () => {
    const text = ownerReceiptMessage(
      makeNotifiableOrder({ paymentStatus: "awaiting_confirmation", locale: "en" }),
      "Змінено в Telegram",
    );
    expect(text).toContain("Квитанція до замовлення №1042");
    expect(text).toContain("Сума: <b>3 000 ₴</b>");
    expect(text).toContain("Статус:</b> Нове · Очікує підтвердження");
    expect(text).toContain("<i>Змінено в Telegram</i>");
  });

  it("confirms a receipt in the customer's language", () => {
    expect(receiptReceivedMessage(makeNotifiableOrder({ locale: "ru" }))).toContain(
      "Квитанцию получили",
    );
    expect(receiptNoOrderMessage("en", "+380971234567")).toContain(
      "please call us: +380971234567",
    );
  });

  it("offers the phone number when there is one", () => {
    expect(helpMessage("+380971234567")).toContain("+380971234567");
    expect(helpMessage("")).toContain("Контакти");
    expect(helpMessage("+380971234567", "en")).toContain("Call us");
    expect(welcomeMessage("ru")).toContain("Добро пожаловать");
  });
});
