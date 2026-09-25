import { z } from "zod";
import { AppError, badRequest, notFound } from "@/lib/errors";
import { adminRoute, json, readJson } from "@/lib/http/route";

const RECENT_LIMIT = 10;
const markReadSchema = z.object({ id: z.string().uuid() });

export const GET = adminRoute(async (_request, { services }) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      services.notifications.listRecent(RECENT_LIMIT),
      services.notifications.countUnread(),
    ]);
    return json({ notifications, unreadCount });
  } catch {
    throw new AppError("Не вдалося завантажити сповіщення.", 500);
  }
});

export const PATCH = adminRoute(async (request, { services }) => {
  const { id } = await readJson(request, markReadSchema, {
    message: "Некоректний запит.",
    invalidMessage: "Сповіщення не знайдено.",
  });
  let updated: boolean;
  try {
    updated = await services.notifications.markRead(id);
  } catch {
    throw badRequest("Не вдалося оновити сповіщення.");
  }
  if (!updated) throw notFound("Сповіщення не знайдено.");
  return json({ ok: true });
});
