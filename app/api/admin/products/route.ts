import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readJson } from "@/lib/http/route";
import { adminProductSchema } from "@/lib/validators/admin-product";

export const POST = adminRoute(async (request, { services }) => {
  const product = await readJson(request, adminProductSchema, {
    message: "Перевірте дані товару.",
    exposeIssue: true,
  });
  const id = await services.products.create(product);
  revalidateStorefront(CACHE_TAGS.products);
  return json({ id }, 201);
});
