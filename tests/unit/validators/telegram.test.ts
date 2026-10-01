import { describe, expect, it } from "vitest";
import { parseChatReference } from "@/lib/validators/telegram";

describe("parseChatReference", () => {
  it("reads a public channel from its @name or link", () => {
    for (const input of [
      "@pontos_shop",
      "pontos_shop",
      " t.me/pontos_shop ",
      "https://t.me/pontos_shop/",
      "http://telegram.me/pontos_shop",
    ]) {
      expect(parseChatReference(input)).toBe("@pontos_shop");
    }
  });

  it("reads a private channel from its numeric id", () => {
    expect(parseChatReference("-1001234567890")).toBe(-1001234567890);
  });

  it("rejects invite links and anything else", () => {
    for (const input of [
      "",
      "https://t.me/+AbCdEf123",
      "https://t.me/joinchat/AbCdEf",
      "https://example.com/pontos",
      "@ab",
      "мій канал",
    ]) {
      expect(parseChatReference(input)).toBeNull();
    }
  });
});
