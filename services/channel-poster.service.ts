import { badRequest, conflict, notFound, unavailable } from "@/lib/errors";
import { TelegramError, type TelegramBot } from "@/lib/telegram/bot";
import { albumPhotos, productPostCaption } from "@/lib/telegram/product-post";
import {
  parseChatReference,
  type TelegramChannel,
} from "@/lib/validators/telegram";
import type {
  AdminProductDetails,
  ChannelPostRepository,
  ProductAdminRepository,
} from "@/repositories/product.repository";
import type { SettingsService } from "@/services/settings.service";

type Channel = NonNullable<TelegramChannel>;

export type ChannelPoster = ReturnType<typeof createChannelPoster>;

/**
 * The store's Telegram channel: each product is posted there (photos, price,
 * sizes, a link to the site) once, when it first goes live. The bot posts as
 * an administrator of the channel.
 */
export function createChannelPoster(deps: {
  products: Pick<ProductAdminRepository, "getById">;
  posts: ChannelPostRepository;
  settings: Pick<SettingsService, "getTelegramChannel" | "saveTelegramChannel">;
  /** null when TELEGRAM_BOT_TOKEN is not set. */
  bot: Pick<TelegramBot, "sendPhotos" | "getChat"> | null;
  /** e.g. "https://pontos-xi.vercel.app"; adds the product link to posts. */
  siteUrl?: string | null;
}) {
  const { products, posts, settings, bot } = deps;
  const siteUrl = deps.siteUrl ?? null;

  async function send(
    sender: Pick<TelegramBot, "sendPhotos">,
    channel: Channel,
    product: AdminProductDetails,
  ) {
    try {
      await sender.sendPhotos(
        channel.chatId,
        albumPhotos(product.images),
        productPostCaption(product, siteUrl),
      );
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "невідома помилка";
      console.error("Telegram channel post failed", reason);
      throw badRequest(`Telegram не прийняв публікацію: ${reason}`);
    }
  }

  return {
    /**
     * Connects the channel an admin named ("@pontos", a t.me link or a
     * numeric id) once the bot is confirmed able to post there. Products
     * already on the site are not announced; only later ones are.
     */
    async connect(reference: string): Promise<Channel> {
      if (!bot) {
        throw unavailable(
          "Бот не налаштований: додайте TELEGRAM_BOT_TOKEN у змінні середовища Vercel.",
        );
      }
      const chat = parseChatReference(reference);
      if (chat === null) {
        throw badRequest(
          "Вкажіть @назву каналу або посилання на нього (t.me/…). Для приватного каналу — його числовий ID.",
        );
      }
      const info = await bot.getChat(chat).catch((error: unknown) => {
        if (error instanceof TelegramError && error.code === 400) {
          throw badRequest("Telegram не знайшов такий канал. Перевірте назву.");
        }
        throw error;
      });
      if (info.type === "private") {
        throw badRequest("Це особистий чат. Вкажіть канал або групу.");
      }
      if (!info.canPost) {
        throw badRequest(
          "Бот не може публікувати в цьому каналі. Додайте його адміністратором із правом публікувати повідомлення і спробуйте ще раз.",
        );
      }
      const channel = {
        chatId: info.id,
        title: info.title,
        username: info.username,
      };
      await settings.saveTelegramChannel(channel);
      await posts.skipPublished();
      return channel;
    },

    disconnect: () => settings.saveTelegramChannel(null),

    /**
     * Runs after every product save. Posts the product the first time it is
     * saved published and with photos; later saves do nothing. Resolves true
     * when a post went out. A failed post stays due for the next save.
     */
    async announce(productId: string): Promise<boolean> {
      if (!bot) return false;
      const channel = await settings.getTelegramChannel();
      if (!channel) return false;
      const product = await products.getById(productId);
      if (!product?.isPublished || product.images.length === 0) return false;
      if (!(await posts.claim(productId))) return false;
      try {
        await send(bot, channel, product);
      } catch (error) {
        await posts.release(productId);
        throw error;
      }
      return true;
    },

    /** The "post to the channel" button: posts now, or says why it cannot. */
    async post(productId: string): Promise<void> {
      const channel = bot ? await settings.getTelegramChannel() : null;
      if (!bot || !channel) {
        throw conflict(
          "Канал не підключено. Підключіть його в розділі «Telegram».",
        );
      }
      const product = await products.getById(productId);
      if (!product) throw notFound("Товар не знайдено.");
      if (!product.isPublished) {
        throw badRequest(
          "Спершу опублікуйте товар на сайті: допис веде на його сторінку.",
        );
      }
      if (product.images.length === 0) {
        throw badRequest("Додайте хоча б одне фото товару.");
      }
      await send(bot, channel, product);
      // Posted by hand, so the automatic post is no longer due.
      await posts.claim(productId);
    },
  };
}
