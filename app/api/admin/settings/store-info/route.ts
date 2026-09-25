import { badRequest } from "@/lib/errors";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readJson } from "@/lib/http/route";
import { storeInfoSchema } from "@/lib/validators/store-info";

export const PUT = adminRoute(async (request, { services }) => {
  const info = await readJson(request, storeInfoSchema, {
    message: "Перевірте дані магазину.",
    exposeIssue: true,
  });
  try {
    await services.settings.saveStoreInfo(info);
  } catch {
    throw badRequest("Не вдалося зберегти інформацію.");
  }
  revalidateStorefront(CACHE_TAGS.storeInfo);
  return json({ ok: true });
});
