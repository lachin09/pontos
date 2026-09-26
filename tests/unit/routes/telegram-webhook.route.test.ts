import { beforeEach, describe, expect, it, vi } from "vitest";
import { webhookSecretFor } from "@/lib/telegram/bot";

const handleUpdate = vi.fn();
vi.mock("@/lib/server/storefront-services", () => ({
  notifyInBackground: (_label: string, task: (n: unknown) => unknown) =>
    task({ handleUpdate }),
}));

const { POST } = await import("@/app/api/telegram/webhook/route");

const update = {
  update_id: 1,
  message: { message_id: 5, chat: { id: 42, type: "private" }, text: "/start" },
};
const send = (secret: string | null, body: unknown = update) =>
  POST(
    new Request("https://shop.test/api/telegram/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-telegram-bot-api-secret-token": secret } : {}),
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "123:test-token");
});

describe("POST /api/telegram/webhook", () => {
  it("hands genuine updates to the notifier with unknown fields dropped", async () => {
    const response = await send(webhookSecretFor("123:test-token"));
    expect(response.status).toBe(200);
    expect(handleUpdate).toHaveBeenCalledWith({
      message: { chat: { id: 42 }, text: "/start" },
    });
  });

  it("rejects requests without the right secret", async () => {
    expect((await send(null)).status).toBe(401);
    expect((await send("guess")).status).toBe(401);
    expect((await send(webhookSecretFor("another-bot"))).status).toBe(401);
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it("answers 200 to malformed updates so Telegram doesn't retry them", async () => {
    const secret = webhookSecretFor("123:test-token");
    expect((await send(secret, "{broken")).status).toBe(200);
    expect(
      (await send(secret, { message: { chat: { id: "x" } } })).status,
    ).toBe(200);
    expect(handleUpdate).not.toHaveBeenCalled();
  });

  it("is switched off when no bot token is configured", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    expect((await send(webhookSecretFor(""))).status).toBe(404);
  });

  it("passes button presses through", async () => {
    const press = {
      update_id: 2,
      callback_query: {
        id: "cb1",
        from: { id: 777 },
        data: "o:c:3f2b1c9e000040008000000000000001",
        message: { message_id: 9, date: 0, chat: { id: 777, type: "private" } },
      },
    };
    await send(webhookSecretFor("123:test-token"), press);
    expect(handleUpdate).toHaveBeenCalledWith({
      callback_query: {
        id: "cb1",
        data: "o:c:3f2b1c9e000040008000000000000001",
        message: { message_id: 9, chat: { id: 777 } },
      },
    });
  });
});
