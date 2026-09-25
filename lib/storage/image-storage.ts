import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ValidImageFile } from "@/lib/storage/image-file";

/** Where product and category photos live. Services depend on this, not on a vendor. */
export interface ImageStorage {
  /** Uploads under `${folder}/<random>.<ext>` and returns the stored path. */
  upload(folder: string, image: ValidImageFile): Promise<string>;
  /** Best-effort delete; failures are logged, never thrown. */
  remove(paths: string[]): Promise<void>;
  publicUrl(path: string): string;
}

export const PRODUCT_IMAGES_BUCKET = "product-images";

/** Category images may be stored as full URLs (seed data) or bucket paths. */
export function isStoragePath(value: string | null): value is string {
  return Boolean(value) && !/^https?:\/\//i.test(value!);
}

export function createSupabaseImageStorage(
  client: SupabaseClient<Database>,
): ImageStorage {
  const bucket = () => client.storage.from(PRODUCT_IMAGES_BUCKET);
  return {
    async upload(folder, { file, mime, extension }) {
      const path = `${folder}/${crypto.randomUUID()}.${extension}`;
      const { error } = await bucket().upload(path, file, {
        contentType: mime,
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) throw error;
      return path;
    },
    async remove(paths) {
      if (paths.length === 0) return;
      const { error } = await bucket().remove(paths);
      if (error) console.error("Image storage cleanup failed", error.name);
    },
    publicUrl(path) {
      return bucket().getPublicUrl(path).data.publicUrl;
    },
  };
}
