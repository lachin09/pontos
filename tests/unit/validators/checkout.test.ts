import { describe, expect, it } from "vitest";
import { checkoutSchema, type CheckoutData } from "@/lib/validators/checkout";

const valid: CheckoutData = {
  firstName: "Олена",
  lastName: "Коваль",
  phone: "+380971234567",
  city: "Київ",
  deliveryCountryCode: "UA",
  deliveryPostalCode: "",
  deliveryMethod: "nova_poshta",
  deliveryAddress: "Відділення №12",
  paymentMethod: "bank_transfer",
  comment: "",
};

const issues = (data: unknown) => {
  const result = checkoutSchema.safeParse(data);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
};

describe("checkoutSchema", () => {
  it("accepts a complete Ukrainian order", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("trims text fields", () => {
    const result = checkoutSchema.parse({ ...valid, firstName: "  Олена  " });
    expect(result.firstName).toBe("Олена");
  });

  it.each(["+380971234567", "0971234567", "+48123456789"])(
    "accepts phone %s",
    (phone) => {
      expect(issues({ ...valid, phone }).phone).toBeUndefined();
    },
  );

  it.each(["097 123 45 67", "12345", "+0971234567", "380971234567"])(
    "rejects phone %s",
    (phone) => {
      expect(issues({ ...valid, phone }).phone).toBe(
        "Введіть коректний номер телефону з кодом країни",
      );
    },
  );

  it("requires names of at least two letters with a readable message", () => {
    expect(issues({ ...valid, firstName: "О" }).firstName).toBe(
      "Ім’я: введіть щонайменше 2 символи",
    );
  });

  it("requires the branch or address", () => {
    expect(issues({ ...valid, deliveryAddress: " " }).deliveryAddress).toBe(
      "Вкажіть відділення або адресу",
    );
  });

  it("rejects countries outside the delivery list", () => {
    expect(
      issues({ ...valid, deliveryCountryCode: "ZZ" }).deliveryCountryCode,
    ).toBeDefined();
  });

  describe("international delivery", () => {
    const abroad = {
      ...valid,
      deliveryCountryCode: "PL",
      deliveryPostalCode: "00-001",
    };

    it("is accepted with Nova Post and a postal code", () => {
      expect(checkoutSchema.safeParse(abroad).success).toBe(true);
    });

    it("only allows Nova Post", () => {
      expect(
        issues({ ...abroad, deliveryMethod: "ukrposhta" }).deliveryMethod,
      ).toBe("Для міжнародної доставки оберіть Нову пошту");
    });

    it("requires a postal code", () => {
      expect(
        issues({ ...abroad, deliveryPostalCode: "" }).deliveryPostalCode,
      ).toBe("Вкажіть поштовий індекс");
    });
  });

  it("limits the comment to 500 characters", () => {
    expect(issues({ ...valid, comment: "а".repeat(501) }).comment).toBe(
      "Коментар має містити до 500 символів",
    );
  });
});
