import { describe, expect, it } from "vitest";
import {
  availableActions,
  callbackData,
  ORDER_ACTIONS,
  parseOwnerCallback,
  type OrderAction,
} from "@/lib/telegram/order-actions";
import { makeNotifiableOrder } from "../../support/factories";

const ID = "3f2b1c9e-0000-4000-8000-000000000001";

describe("availableActions", () => {
  it.each([
    [{ status: "new" }, ["confirm", "cancel"]],
    [
      {
        status: "confirmed",
        paymentMethod: "bank_transfer",
        paymentStatus: "pending",
      },
      ["paid", "cancel"],
    ],
    [
      {
        status: "payment_pending",
        paymentMethod: "bank_transfer",
        paymentStatus: "pending",
      },
      ["paid", "cancel"],
    ],
    [
      {
        status: "confirmed",
        paymentMethod: "cash_on_delivery",
        paymentStatus: "cash_on_delivery",
      },
      ["ship", "cancel"],
    ],
    [
      {
        status: "confirmed",
        paymentMethod: "bank_transfer",
        paymentStatus: "paid",
      },
      ["ship", "cancel"],
    ],
    [{ status: "paid" }, ["ship", "cancel"]],
    [{ status: "processing" }, ["ship", "cancel"]],
    [{ status: "shipped" }, ["deliver"]],
    [{ status: "delivered" }, []],
    [{ status: "cancelled" }, []],
  ] as const)("%o → %o", (overrides, expected) => {
    expect(availableActions(makeNotifiableOrder(overrides))).toEqual(expected);
  });
});

describe("ORDER_ACTIONS", () => {
  const from = { status: "confirmed", paymentStatus: "pending" } as const;
  it.each([
    ["confirm", { status: "confirmed", paymentStatus: "pending" }],
    ["paid", { status: "paid", paymentStatus: "paid" }],
    ["ship", { status: "shipped", paymentStatus: "pending" }],
    ["deliver", { status: "delivered", paymentStatus: "pending" }],
    ["cancel", { status: "cancelled", paymentStatus: "pending" }],
  ] as const)("%s sets %o", (action, expected) => {
    expect(ORDER_ACTIONS[action as OrderAction].apply(from)).toEqual(expected);
  });

  it("uses unique single-character codes", () => {
    const codes = Object.values(ORDER_ACTIONS).map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((code) => /^[a-z]$/.test(code))).toBe(true);
  });
});

describe("callback data", () => {
  it("fits Telegram's 64-byte limit and round-trips", () => {
    for (const action of Object.keys(ORDER_ACTIONS) as OrderAction[]) {
      const data = callbackData.action(action, ID);
      expect(new TextEncoder().encode(data).length).toBeLessThanOrEqual(64);
      expect(parseOwnerCallback(data)).toEqual({
        kind: "action",
        action,
        orderId: ID,
      });
    }
    expect(parseOwnerCallback(callbackData.confirmCancel(ID))).toEqual({
      kind: "confirm-cancel",
      orderId: ID,
    });
    expect(parseOwnerCallback(callbackData.back(ID))).toEqual({
      kind: "back",
      orderId: ID,
    });
  });

  it.each([
    "",
    "o:c:short",
    "o:z:3f2b1c9e000040008000000000000001",
    "x:c:3f2b1c9e000040008000000000000001",
    "o:c:3F2B1C9E000040008000000000000001",
  ])("rejects %s", (data) => {
    expect(parseOwnerCallback(data)).toBeNull();
  });
});
