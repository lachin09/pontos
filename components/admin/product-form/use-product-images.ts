"use client";

import { useState } from "react";
import { adminProductsApi } from "@/lib/api/admin";
import { ApiError, errorMessage } from "@/lib/api/client";
import type {
  NewProductImage,
  ProductImageDraft,
} from "@/components/admin/product-form/types";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Product photos: the saved images (order, alt text, colour tag, deletion)
 * and the locally picked files waiting to be uploaded on save.
 */
export function useProductImages(
  initialImages: ProductImageDraft[],
  onError: (message: string | null) => void,
) {
  const [images, setImages] = useState(initialImages);
  const [newFiles, setNewFiles] = useState<NewProductImage[]>([]);

  const chooseImages = (
    files: FileList | null,
    defaultColor: string | null,
  ) => {
    if (!files) return;
    const selected = Array.from(files);
    const invalid = selected.find(
      (file) =>
        !IMAGE_TYPES.includes(file.type) ||
        file.size > MAX_IMAGE_BYTES ||
        file.size < 1,
    );
    if (invalid) {
      onError("Додайте JPG, PNG, WebP або AVIF розміром до 10 МБ кожне.");
      return;
    }
    onError(null);
    setNewFiles((current) => [
      ...current,
      ...selected.map((file) => ({ file, color: defaultColor })),
    ]);
  };

  const updateImage = (
    id: string,
    patch: Partial<Pick<ProductImageDraft, "alt" | "color">>,
  ) => {
    setImages((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const moveImage = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    setImages(reordered.map((image, sortOrder) => ({ ...image, sortOrder })));
  };

  const deleteImage = async (
    productId: string | undefined,
    image: ProductImageDraft,
  ) => {
    if (!productId || !window.confirm("Видалити це фото товару?")) return;
    onError(null);
    try {
      await adminProductsApi.removeImage(productId, image.id);
      setImages((current) => current.filter((entry) => entry.id !== image.id));
    } catch (error) {
      onError(errorMessage(error, "Не вдалося видалити фото."));
    }
  };

  const setNewFileColor = (index: number, color: string | null) => {
    setNewFiles((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, color } : item,
      ),
    );
  };

  const removeNewFile = (index: number) => {
    setNewFiles((current) => current.filter((_, row) => row !== index));
  };

  /**
   * Saves order, alt text and colour of every saved image. Resolves false if
   * the server rejected any of them; connection failures are rethrown.
   */
  const saveImageDetails = async (productId: string) => {
    const results = await Promise.all(
      images.map((image, index) =>
        adminProductsApi
          .updateImage(productId, image.id, {
            alt: image.alt,
            color: image.color,
            sortOrder: index,
          })
          .then(
            () => true,
            (error: unknown) => {
              if (error instanceof ApiError && error.status > 0) return false;
              throw error;
            },
          ),
      ),
    );
    return results.every(Boolean);
  };

  /** Uploads pending files one by one; stops at the first failure. */
  const uploadNewFiles = async (productId: string, alt: string) => {
    for (const entry of newFiles) {
      const file = entry.file;
      const body = new FormData();
      body.set("file", file);
      body.set("alt", alt);
      if (entry.color) body.set("color", entry.color);
      try {
        const { image } = await adminProductsApi.uploadImage(productId, body);
        if (!image) {
          onError(`Не вдалося завантажити ${file.name}.`);
          return false;
        }
        setImages((current) => [...current, image]);
        setNewFiles((current) => current.filter((item) => item !== entry));
      } catch (error) {
        onError(errorMessage(error, `Не вдалося завантажити ${file.name}.`));
        return false;
      }
    }
    return true;
  };

  return {
    images,
    newFiles,
    chooseImages,
    updateImage,
    moveImage,
    deleteImage,
    setNewFileColor,
    removeNewFile,
    saveImageDetails,
    uploadNewFiles,
  };
}
