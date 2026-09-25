import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readJson } from "@/lib/http/route";
import {
  adminCategoryReorderSchema,
  adminCategorySchema,
} from "@/lib/validators/admin-category";

export const POST = adminRoute(async (request, { services }) => {
  const category = await readJson(request, adminCategorySchema, {
    message: "Перевірте дані категорії.",
    exposeIssue: true,
  });
  const id = await services.categories.create(category);
  revalidateStorefront(CACHE_TAGS.categories);
  return json({ id }, 201);
});

export const PATCH = adminRoute(async (request, { services }) => {
  const { ids } = await readJson(request, adminCategoryReorderSchema, {
    message: "Перевірте порядок категорій.",
  });
  await services.categories.reorder(ids);
  revalidateStorefront(CACHE_TAGS.categories);
  return json({ ok: true });
});
