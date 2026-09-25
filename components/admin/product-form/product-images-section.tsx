"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import type {
  NewProductImage,
  ProductImageDraft,
} from "@/components/admin/product-form/types";

interface ProductImagesSectionProps {
  images: ProductImageDraft[];
  newFiles: NewProductImage[];
  /** Fallback alt text for images without their own description. */
  productName: string;
  /** Variant colours an image can be tagged with. */
  colors: string[];
  onChoose: (files: FileList | null) => void;
  onImageChange: (
    id: string,
    patch: Partial<Pick<ProductImageDraft, "alt" | "color">>,
  ) => void;
  onImageMove: (index: number, offset: -1 | 1) => void;
  onImageDelete: (image: ProductImageDraft) => void;
  onNewFileColorChange: (index: number, color: string | null) => void;
  onNewFileRemove: (index: number) => void;
}

/** Photo picker plus the saved and pending product images. */
export function ProductImagesSection({
  images,
  newFiles,
  productName,
  colors,
  onChoose,
  onImageChange,
  onImageMove,
  onImageDelete,
  onNewFileColorChange,
  onNewFileRemove,
}: ProductImagesSectionProps) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-medium">Фото товару</h2>
        <p className="mt-1 text-sm text-muted">
          JPG, PNG, WebP або AVIF. До 10 МБ на файл. Перше фото показується
          основним.
        </p>
      </div>
      <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface-muted/40 px-4 py-6 text-center hover:border-focus">
        <Upload size={19} className="text-muted" aria-hidden="true" />
        <span className="text-sm font-medium">Вибрати фото з пристрою</span>
        <span className="text-xs text-muted">
          Можна вибрати декілька зображень
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => {
            onChoose(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {images.length || newFiles.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="grid grid-cols-[88px_1fr] gap-3 rounded-md border border-border p-3"
            >
              <div className="relative aspect-square overflow-hidden rounded bg-surface-muted">
                <Image
                  src={image.url}
                  alt={image.alt || productName}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[0.6rem]">
                    Основне
                  </span>
                ) : null}
              </div>
              <div className="grid min-w-0 content-between gap-2">
                <label className="grid gap-1 text-xs text-muted">
                  Колір фото
                  <select
                    value={image.color ?? ""}
                    onChange={(event) =>
                      onImageChange(image.id, {
                        color: event.target.value || null,
                      })
                    }
                    className="min-h-9 rounded border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-focus"
                  >
                    <ColorOptions colors={colors} />
                  </select>
                </label>
                <input
                  aria-label={`Опис фото ${index + 1}`}
                  value={image.alt}
                  onChange={(event) =>
                    onImageChange(image.id, { alt: event.target.value })
                  }
                  placeholder="Опис фото"
                  maxLength={200}
                  className="min-h-9 min-w-0 rounded border border-border bg-surface px-2 text-xs outline-none focus:border-focus"
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    aria-label="Перемістити фото вище"
                    disabled={index === 0}
                    onClick={() => onImageMove(index, -1)}
                    className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Перемістити фото нижче"
                    disabled={index === images.length - 1}
                    onClick={() => onImageMove(index, 1)}
                    className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Видалити фото"
                    onClick={() => onImageDelete(image)}
                    className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {newFiles.map((entry, index) => (
            <div
              key={`${entry.file.name}-${entry.file.lastModified}`}
              className="grid min-h-24 gap-3 rounded-md border border-dashed border-border p-4 text-sm sm:grid-cols-[1fr_12rem_auto] sm:items-center"
            >
              <span className="min-w-0 truncate">{entry.file.name}</span>
              <select
                aria-label={`Колір фото ${entry.file.name}`}
                value={entry.color ?? ""}
                onChange={(event) =>
                  onNewFileColorChange(index, event.target.value || null)
                }
                className="min-h-9 rounded border border-border bg-surface px-2 text-xs outline-none focus:border-focus"
              >
                <ColorOptions colors={colors} />
              </select>
              <button
                type="button"
                aria-label={`Прибрати ${entry.file.name}`}
                onClick={() => onNewFileRemove(index)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ColorOptions({ colors }: { colors: string[] }) {
  return (
    <>
      <option value="">Усі кольори</option>
      {colors.map((color) => (
        <option key={color} value={color}>
          {color}
        </option>
      ))}
    </>
  );
}
