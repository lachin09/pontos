import { badRequest } from "@/lib/errors";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import { revalidateStorefront } from "@/lib/data/revalidate";
import { adminRoute, json, readForm } from "@/lib/http/route";
import { validateImageFile } from "@/lib/storage/image-file";
import { adminProductImageSchema } from "@/lib/validators/admin-product";

type Context = RouteContext<"/api/admin/products/[id]/images">;

export const POST = adminRoute<Context>(
  async (request, { params, services }) => {
    const { id: productId } = await params;
    const form = await readForm(request);
    const file = await validateImageFile(form.get("file"));
    const details = adminProductImageSchema.safeParse({
      alt: form.get("alt") ?? "",
      color: form.get("color") || null,
    });
    if (!details.success) {
      throw badRequest("Опис зображення має містити до 200 символів.");
    }

    const image = await services.products.addImage(productId, file, {
      alt: details.data.alt ?? "",
      color: details.data.color,
    });
    revalidateStorefront(CACHE_TAGS.products);
    return json(
      {
        image: {
          id: image.id,
          productId: image.productId,
          url: image.url,
          alt: image.alt,
          color: image.color,
          sortOrder: image.sortOrder,
          createdAt: image.createdAt,
        },
      },
      201,
    );
  },
);
