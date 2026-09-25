import { badRequest } from "@/lib/errors";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export type ImageMime = keyof typeof EXTENSIONS;

/** Reads the file signature instead of trusting the browser's MIME type. */
function detectImageMime(bytes: Uint8Array): ImageMime | null {
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

export type ValidImageFile = {
  file: File;
  mime: ImageMime;
  extension: (typeof EXTENSIONS)[ImageMime];
};

/** Checks an uploaded form value is a supported image under the size limit. */
export async function validateImageFile(
  value: FormDataEntryValue | null,
): Promise<ValidImageFile> {
  if (
    !(value instanceof File) ||
    value.size < 1 ||
    value.size > MAX_IMAGE_BYTES
  ) {
    throw badRequest("Оберіть зображення розміром до 10 МБ.");
  }
  const mime = detectImageMime(new Uint8Array(await value.arrayBuffer()));
  if (!mime || mime !== value.type) {
    throw badRequest("Підтримуються зображення JPG, PNG, WebP та AVIF.");
  }
  return { file: value, mime, extension: EXTENSIONS[mime] };
}
