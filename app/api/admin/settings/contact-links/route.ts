import { badRequest } from "@/lib/errors";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readJson } from "@/lib/http/route";
import { contactLinksSchema } from "@/lib/validators/contact-links";

export const PUT = adminRoute(async (request, { services }) => {
  const contactLinks = await readJson(request, contactLinksSchema, {
    message: "Перевірте контактні дані.",
    exposeIssue: true,
  });
  const ids = contactLinks.links.map((link) => link.id);
  if (new Set(ids).size !== ids.length) {
    throw badRequest("Контакт повторюється.");
  }
  try {
    await services.settings.saveContactLinks(contactLinks);
  } catch {
    throw badRequest("Не вдалося зберегти контакти.");
  }
  revalidateStorefront(CACHE_TAGS.contactLinks);
  return json({ ok: true });
});
