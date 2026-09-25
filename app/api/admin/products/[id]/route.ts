import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readJson } from "@/lib/http/route";
import { adminProductSchema } from "@/lib/validators/admin-product";

type Context = RouteContext<"/api/admin/products/[id]">;

export const PUT = adminRoute<Context>(
  async (request, { params, services }) => {
    const { id } = await params;
    const product = await readJson(request, adminProductSchema, {
      message: "Перевірте дані товару.",
      exposeIssue: true,
    });
    await services.products.update(id, product);
    revalidateStorefront(CACHE_TAGS.products);
    return json({ id });
  },
);

export const DELETE = adminRoute<Context>(
  async (_request, { params, services }) => {
    const { id } = await params;
    await services.products.remove(id);
    revalidateStorefront(CACHE_TAGS.products);
    return json({ ok: true });
  },
);
