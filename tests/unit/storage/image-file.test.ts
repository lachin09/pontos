import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { validateImageFile } from "@/lib/storage/image-file";

const SIGNATURES = {
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
  "image/avif": [0, 0, 0, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66],
} as const;

const file = (bytes: readonly number[], type: string, size = 64) => {
  const body = new Uint8Array(Math.max(size, bytes.length));
  body.set(bytes);
  return new File([body], "photo", { type });
};

const rejection = async (value: FormDataEntryValue | null) => {
  const error = await validateImageFile(value).catch((caught) => caught);
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
};

describe("validateImageFile", () => {
  it.each(Object.entries(SIGNATURES))(
    "accepts a real %s file",
    async (mime, bytes) => {
      const result = await validateImageFile(file(bytes, mime));
      expect(result.mime).toBe(mime);
      expect(result.extension).toBe(
        {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/avif": "avif",
        }[mime],
      );
    },
  );

  it("rejects a file whose content does not match its declared type", async () => {
    const error = await rejection(file(SIGNATURES["image/png"], "image/jpeg"));
    expect(error.status).toBe(400);
    expect(error.message).toBe(
      "Підтримуються зображення JPG, PNG, WebP та AVIF.",
    );
  });

  it("rejects other formats such as GIF or SVG", async () => {
    await rejection(file([0x47, 0x49, 0x46, 0x38], "image/gif"));
    await rejection(file([...Buffer.from("<svg ")], "image/svg+xml"));
  });

  it("rejects empty, oversized and non-file values", async () => {
    const tooBig = file(
      SIGNATURES["image/jpeg"],
      "image/jpeg",
      10 * 1024 * 1024 + 1,
    );
    for (const value of [
      new File([], "empty", { type: "image/jpeg" }),
      tooBig,
      "text",
      null,
    ]) {
      const error = await rejection(value);
      expect(error.message).toBe("Оберіть зображення розміром до 10 МБ.");
    }
  });
});
