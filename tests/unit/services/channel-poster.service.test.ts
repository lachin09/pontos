import { describe, expect, it, vi } from "vitest";
import { TelegramError, type TelegramChat } from "@/lib/telegram/bot";
import type { TelegramChannel } from "@/lib/validators/telegram";
import type { AdminProductDetails } from "@/repositories/product.repository";
import { createChannelPoster } from "@/services/channel-poster.service";
import { makeImage, makeProduct } from "../../support/factories";

const CHANNEL = { chatId: -1001, title: "PONTOS", username: "pontos" };
const CHAT: TelegramChat = {
  id: -1001,
  type: "channel",
  title: "PONTOS",
  username: "pontos",
  canPost: true,
};

function setup({
  channel = CHANNEL as TelegramChannel,
  product = {} as Partial<AdminProductDetails>,
  pending = true,
  chat = CHAT as TelegramChat | TelegramError,
  failSend = false,
  withBot = true,
} = {}) {
  const saved: AdminProductDetails = {
    ...makeProduct({ id: "p1", slug: "palto" }),
    isPublished: true,
    ...product,
  };
  const state = { channel, pending, skippedPublished: false };
  const posts: { chatId: number; photos: string[]; caption: string }[] = [];

  const poster = createChannelPoster({
    products: { getById: async (id) => (id === saved.id ? saved : null) },
    posts: {
      async claim() {
        const claimed = state.pending;
        state.pending = false;
        return claimed;
      },
      async release() {
        state.pending = true;
      },
      async skipPublished() {
        state.skippedPublished = true;
      },
    },
    settings: {
      getTelegramChannel: async () => state.channel,
      async saveTelegramChannel(value) {
        state.channel = value;
      },
    },
    bot: withBot
      ? {
          async sendPhotos(chatId, photos, caption) {
            if (failSend) throw new TelegramError("Forbidden: kicked", 403);
            posts.push({ chatId, photos, caption });
          },
          async getChat() {
            if (chat instanceof TelegramError) throw chat;
            return chat;
          },
        }
      : null,
    siteUrl: "https://shop.test",
  });
  return { poster, posts, state, saved };
}

describe("channel poster", () => {
  describe("announce (after a save)", () => {
    it("posts a newly published product with its photos and link, once", async () => {
      const images = [makeImage(), makeImage()];
      const { poster, posts, state } = setup({ product: { images } });

      await expect(poster.announce("p1")).resolves.toBe(true);
      expect(posts).toHaveLength(1);
      expect(posts[0]).toMatchObject({
        chatId: -1001,
        photos: images.map((image) => image.url),
      });
      expect(posts[0].caption).toContain("https://shop.test/product/palto");
      expect(state.pending).toBe(false);

      await expect(poster.announce("p1")).resolves.toBe(false);
      expect(posts).toHaveLength(1);
    });

    it("waits until the product is published", async () => {
      const { poster, posts, state } = setup({
        product: { isPublished: false },
      });
      await expect(poster.announce("p1")).resolves.toBe(false);
      expect(posts).toHaveLength(0);
      expect(state.pending).toBe(true);
    });

    it("waits until the product has a photo", async () => {
      const { poster, posts, state } = setup({ product: { images: [] } });
      await expect(poster.announce("p1")).resolves.toBe(false);
      expect(posts).toHaveLength(0);
      expect(state.pending).toBe(true);
    });

    it("does nothing without a channel or a bot", async () => {
      for (const options of [{ channel: null }, { withBot: false }]) {
        const { poster, posts, state } = setup(options);
        await expect(poster.announce("p1")).resolves.toBe(false);
        expect(posts).toHaveLength(0);
        expect(state.pending).toBe(true);
      }
    });

    it("keeps the product due when Telegram refuses the post", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const { poster, state } = setup({ failSend: true });
      await expect(poster.announce("p1")).rejects.toMatchObject({
        status: 400,
        message: "Telegram не прийняв публікацію: Forbidden: kicked",
      });
      expect(state.pending).toBe(true);
    });
  });

  describe("post (the button)", () => {
    it("posts a product again even if it was announced before", async () => {
      const { poster, posts } = setup({ pending: false });
      await poster.post("p1");
      expect(posts).toHaveLength(1);
    });

    it("counts as the product's announcement", async () => {
      const { poster, posts, state } = setup();
      await poster.post("p1");
      expect(state.pending).toBe(false);
      await expect(poster.announce("p1")).resolves.toBe(false);
      expect(posts).toHaveLength(1);
    });

    it("explains what is missing instead of posting", async () => {
      await expect(
        setup({ channel: null }).poster.post("p1"),
      ).rejects.toMatchObject({ status: 409 });
      await expect(setup().poster.post("missing")).rejects.toMatchObject({
        status: 404,
      });
      await expect(
        setup({ product: { isPublished: false } }).poster.post("p1"),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        setup({ product: { images: [] } }).poster.post("p1"),
      ).rejects.toMatchObject({
        status: 400,
        message: "Додайте хоча б одне фото товару.",
      });
    });
  });

  describe("connect", () => {
    it("saves the channel and counts products already on the site as announced", async () => {
      const { poster, state } = setup({ channel: null });
      await expect(poster.connect("https://t.me/pontos")).resolves.toEqual(
        CHANNEL,
      );
      expect(state.channel).toEqual(CHANNEL);
      expect(state.skippedPublished).toBe(true);
    });

    it("refuses a channel where the bot cannot post", async () => {
      const { poster, state } = setup({
        channel: null,
        chat: { ...CHAT, canPost: false },
      });
      await expect(poster.connect("@pontos")).rejects.toMatchObject({
        status: 400,
      });
      expect(state.channel).toBeNull();
      expect(state.skippedPublished).toBe(false);
    });

    it("refuses names Telegram cannot resolve and unknown channels", async () => {
      await expect(
        setup().poster.connect("https://t.me/+AbCdEf123"),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        setup({
          chat: new TelegramError("Bad Request: chat not found", 400),
        }).poster.connect("@nobody_here"),
      ).rejects.toMatchObject({
        status: 400,
        message: "Telegram не знайшов такий канал. Перевірте назву.",
      });
    });

    it("refuses a personal chat", async () => {
      const { poster } = setup({ chat: { ...CHAT, type: "private" } });
      await expect(poster.connect("123456789")).rejects.toMatchObject({
        message: "Це особистий чат. Вкажіть канал або групу.",
      });
    });

    it("disconnects", async () => {
      const { poster, state } = setup();
      await poster.disconnect();
      expect(state.channel).toBeNull();
    });
  });
});
