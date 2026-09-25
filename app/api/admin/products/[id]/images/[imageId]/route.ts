import { z } from "zod";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readJson } from "@/lib/http/route";

type Context = RouteContext<"/api/admin/products/[id]/images/[imageId]">;

const imageUpdateSchema = z.object({
  alt: z.string().trim().max(200),
  color: z
    .string()
    .trim()
    .max(80)
    .nullable()
    .optional()
    .transform((val) => (val ? val : null)),
  sortOrder: z.number().int().min(0).max(1000),
});

export const PATCH = adminRoute<Context>(
  async (request, { params, services }) => {
    const { id: productId, imageId } = await params;
    const changes = await readJson(request, imageUpdateSchema, {
      message: "Перевірте дані зображення.",
      invalidMessage: "Перевірте опис та порядок зображення.",
    });
    await services.products.updateImage(productId, imageId, changes);
    revalidateStorefront(CACHE_TAGS.products);
    return json({ ok: true });
  },
);

export const DELETE = adminRoute<Context>(
  async (_request, { params, services }) => {
    const { id: productId, imageId } = await params;
    await services.products.removeImage(productId, imageId);
    revalidateStorefront(CACHE_TAGS.products);
    return json({ ok: true });
  },
);
