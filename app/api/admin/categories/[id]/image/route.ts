import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readForm } from "@/lib/http/route";
import { validateImageFile } from "@/lib/storage/image-file";

type Context = RouteContext<"/api/admin/categories/[id]/image">;

export const POST = adminRoute<Context>(
  async (request, { params, services }) => {
    const { id } = await params;
    const form = await readForm(request);
    const file = await validateImageFile(form.get("file"));
    const imageUrl = await services.categories.setImage(id, file);
    revalidateStorefront(CACHE_TAGS.categories);
    return json({ imageUrl });
  },
);

export const DELETE = adminRoute<Context>(
  async (_request, { params, services }) => {
    const { id } = await params;
    await services.categories.removeImage(id);
    revalidateStorefront(CACHE_TAGS.categories);
    return json({ ok: true });
  },
);
