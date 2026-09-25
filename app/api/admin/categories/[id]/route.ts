import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readJson } from "@/lib/http/route";
import { adminCategorySchema } from "@/lib/validators/admin-category";

type Context = RouteContext<"/api/admin/categories/[id]">;

export const PUT = adminRoute<Context>(
  async (request, { params, services }) => {
    const { id } = await params;
    const category = await readJson(request, adminCategorySchema, {
      message: "Перевірте дані категорії.",
      exposeIssue: true,
    });
    await services.categories.update(id, category);
    revalidateStorefront(CACHE_TAGS.categories);
    return json({ id });
  },
);

export const DELETE = adminRoute<Context>(
  async (_request, { params, services }) => {
    const { id } = await params;
    await services.categories.remove(id);
    revalidateStorefront(CACHE_TAGS.categories);
    return json({ ok: true });
  },
);
