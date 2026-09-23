import { NextResponse } from "next/server";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";
import { adminProductImageSchema } from "@/lib/validators/admin-product";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const mimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function detectImageMime(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "image/webp";
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    ["avif", "avis"].includes(String.fromCharCode(...bytes.slice(8, 12)))
  )
    return "image/avif";
  return null;
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/products/[id]/images">,
) {
  const session = await getActiveAdminSession();
  if (!session)
    return NextResponse.json(
      { error: "Потрібен доступ адміністратора." },
      { status: 401 },
    );
  const { id: productId } = await context.params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Не вдалося прочитати файл." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Оберіть зображення розміром до 10 МБ." },
      { status: 400 },
    );
  }
  const detectedMime = detectImageMime(
    new Uint8Array(await file.arrayBuffer()),
  );
  if (
    !detectedMime ||
    detectedMime !== file.type ||
    !mimeExtensions[detectedMime]
  ) {
    return NextResponse.json(
      { error: "Підтримуються зображення JPG, PNG, WebP та AVIF." },
      { status: 400 },
    );
  }

  const parsedImage = adminProductImageSchema.safeParse({
    alt: formData.get("alt") ?? "",
  });
  if (!parsedImage.success) {
    return NextResponse.json(
      { error: "Опис зображення має містити до 200 символів." },
      { status: 400 },
    );
  }

  const { data: product, error: productError } = await session.supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError || !product) {
    return NextResponse.json({ error: "Товар не знайдено." }, { status: 404 });
  }

  const { data: lastImage, error: orderError } = await session.supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) {
    return NextResponse.json(
      { error: "Не вдалося підготувати зображення." },
      { status: 500 },
    );
  }

  const storagePath = `${productId}/${crypto.randomUUID()}.${mimeExtensions[detectedMime]}`;
  const { error: uploadError } = await session.supabase.storage
    .from("product-images")
    .upload(storagePath, file, {
      contentType: detectedMime,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) {
    return NextResponse.json(
      { error: "Не вдалося завантажити зображення." },
      { status: 400 },
    );
  }

  const { data: image, error: insertError } = await session.supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: storagePath,
      alt: parsedImage.data.alt ?? "",
      sort_order: (lastImage?.sort_order ?? -1) + 1,
    })
    .select("id, product_id, storage_path, alt, sort_order, created_at")
    .single();

  if (insertError || !image) {
    await session.supabase.storage.from("product-images").remove([storagePath]);
    console.error(
      "Product image record creation failed",
      insertError?.code ?? "empty response",
    );
    return NextResponse.json(
      { error: "Не вдалося зберегти зображення." },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      image: {
        id: image.id,
        productId: image.product_id,
        url: session.supabase.storage
          .from("product-images")
          .getPublicUrl(image.storage_path).data.publicUrl,
        alt: image.alt,
        sortOrder: image.sort_order,
        createdAt: image.created_at,
      },
    },
    { status: 201 },
  );
}
