import type { ImageStorage } from "@/lib/storage/image-storage";
import type { ValidImageFile } from "@/lib/storage/image-file";
import type { SettingsRepository } from "@/repositories/settings.repository";

/** In-memory ImageStorage that records calls and can be told to fail. */
export function fakeStorage() {
  const files = new Set<string>();
  let uploads = 0;
  const storage: ImageStorage & {
    files: Set<string>;
    removed: string[];
    failUpload: boolean;
  } = {
    files,
    removed: [],
    failUpload: false,
    async upload(folder) {
      if (storage.failUpload) throw new Error("storage down");
      const path = `${folder}/file-${++uploads}.jpg`;
      files.add(path);
      return path;
    },
    async remove(paths) {
      for (const path of paths) {
        files.delete(path);
        storage.removed.push(path);
      }
    },
    publicUrl: (path) => `https://cdn.test/${path}`,
  };
  return storage;
}

export const fakeImage: ValidImageFile = {
  file: new File([new Uint8Array([0xff, 0xd8, 0xff])], "a.jpg", {
    type: "image/jpeg",
  }),
  mime: "image/jpeg",
  extension: "jpg",
};

/** In-memory key/value settings store. */
export function fakeSettings(initial: Record<string, unknown> = {}) {
  const values = new Map(Object.entries(initial));
  const repository: SettingsRepository & { values: Map<string, unknown> } = {
    values,
    async get(key, schema, fallback) {
      if (!values.has(key)) return fallback;
      const parsed = schema.safeParse(values.get(key));
      return parsed.success ? parsed.data : fallback;
    },
    async save(key, value) {
      values.set(key, structuredClone(value));
    },
  };
  return repository;
}
