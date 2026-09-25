"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface ProductCategoryOption {
  id: string;
  name: string;
}

export interface ProductVariantDraft {
  id?: string;
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  price: string;
  stock: string;
  is_available: boolean;
}

export interface ProductImageDraft {
  id: string;
  url: string;
  alt: string;
  color: string | null;
  sortOrder: number;
}

interface NewProductImage {
  file: File;
  color: string | null;
}

interface ProductDraft {
  id?: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  composition: string;
  care_instructions: string;
  price: string;
  old_price: string;
  is_published: boolean;
  is_available: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_sale: boolean;
  variants: ProductVariantDraft[];
}

interface AdminProductFormProps {
  categories: ProductCategoryOption[];
  initialProduct?: ProductDraft;
  initialImages?: ProductImageDraft[];
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const slugMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ю: "yu",
  я: "ya",
  ь: "",
};

function makeSlug(value: string) {
  return value
    .toLocaleLowerCase("uk")
    .split("")
    .map((character) => slugMap[character] ?? character)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function newVariant(price = ""): ProductVariantDraft {
  return {
    sku: `PT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    size: "",
    color: "",
    color_hex: "#222222",
    price,
    stock: "0",
    is_available: true,
  };
}

function initialDraft(categories: ProductCategoryOption[]): ProductDraft {
  return {
    category_id: categories[0]?.id ?? "",
    name: "",
    slug: "",
    description: "",
    composition: "",
    care_instructions: "",
    price: "",
    old_price: "",
    is_published: false,
    is_available: true,
    is_featured: false,
    is_new: false,
    is_sale: false,
    variants: [newVariant()],
  };
}

export function AdminProductForm({
  categories,
  initialProduct,
  initialImages = [],
}: AdminProductFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductDraft>(
    () => initialProduct ?? initialDraft(categories),
  );
  const [images, setImages] = useState(initialImages);
  const [newFiles, setNewFiles] = useState<NewProductImage[]>([]);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProduct));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const update = <K extends keyof ProductDraft>(
    key: K,
    value: ProductDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateVariant = (
    index: number,
    patch: Partial<ProductVariantDraft>,
  ) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  };

  const uploadImages = async (productId: string, files: NewProductImage[]) => {
    let allUploaded = true;
    for (const entry of files) {
      const file = entry.file;
      const body = new FormData();
      body.set("file", file);
      body.set("alt", draft.name);
      if (entry.color) body.set("color", entry.color);
      try {
        const response = await fetch(
          `/api/admin/products/${productId}/images`,
          {
            method: "POST",
            body,
          },
        );
        const result: { image?: ProductImageDraft; error?: string } =
          await response.json();
        if (!response.ok || !result.image) {
          setError(result.error ?? `Не вдалося завантажити ${file.name}.`);
          allUploaded = false;
          break;
        }
        setImages((current) => [...current, result.image!]);
        setNewFiles((current) => current.filter((item) => item !== entry));
      } catch {
        setError(`Не вдалося завантажити ${file.name}.`);
        allUploaded = false;
        break;
      }
    }
    return allUploaded;
  };

  const saveImageDetails = async (
    productId: string,
    currentImages: ProductImageDraft[],
  ) => {
    const results = await Promise.all(
      currentImages.map(async (image, index) => {
        const response = await fetch(
          `/api/admin/products/${productId}/images/${image.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alt: image.alt,
              color: image.color,
              sortOrder: index,
            }),
          },
        );
        return response.ok;
      }),
    );
    return results.every(Boolean);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      category_id: draft.category_id,
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      description: draft.description.trim(),
      composition: draft.composition.trim(),
      care_instructions: draft.care_instructions.trim(),
      price: Number(draft.price),
      old_price: draft.old_price === "" ? null : Number(draft.old_price),
      is_published: draft.is_published,
      is_available: draft.is_available,
      is_featured: draft.is_featured,
      is_new: draft.is_new,
      is_sale: draft.is_sale,
      variants: draft.variants.map((variant) => ({
        ...(variant.id ? { id: variant.id } : {}),
        sku: variant.sku.trim(),
        size: variant.size.trim(),
        color: variant.color.trim(),
        color_hex: variant.color_hex,
        price: Number(variant.price),
        stock: Number(variant.stock),
        is_available: variant.is_available,
      })),
    };

    try {
      const productId = draft.id;
      const response = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result: { id?: string; error?: string } = await response.json();
      if (!response.ok || !result.id) {
        setError(
          result.error ?? "Перевірте заповнені поля та спробуйте ще раз.",
        );
        return;
      }

      if (!draft.id) update("id", result.id);
      const imageDetailsSaved = await saveImageDetails(result.id, images);
      if (!imageDetailsSaved) {
        setError(
          "Товар збережено, але не вдалося оновити порядок або описи фото. Спробуйте зберегти ще раз.",
        );
        return;
      }

      const imagesUploaded = await uploadImages(result.id, newFiles);
      if (!imagesUploaded) {
        setError(
          "Товар уже збережено. Перевірте фото та спробуйте завантажити їх ще раз.",
        );
        return;
      }

      setNotice("Зміни збережено.");
      if (window.location.pathname.endsWith("/admin/products/new")) {
        router.replace(`/admin/products/${result.id}/edit`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setError("Не вдалося з’єднатися із сервером. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  };

  const chooseImages = (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    const invalid = selected.find(
      (file) =>
        !IMAGE_TYPES.includes(file.type) ||
        file.size > MAX_IMAGE_BYTES ||
        file.size < 1,
    );
    if (invalid) {
      setError("Додайте JPG, PNG, WebP або AVIF розміром до 10 МБ кожне.");
      return;
    }
    setError(null);
    const defaultColor = draft.variants[0]?.color.trim() || null;
    setNewFiles((current) => [
      ...current,
      ...selected.map((file) => ({ file, color: defaultColor })),
    ]);
  };

  const deleteImage = async (image: ProductImageDraft) => {
    if (!draft.id || !window.confirm("Видалити це фото товару?")) return;
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/products/${draft.id}/images/${image.id}`,
        { method: "DELETE" },
      );
      const result: { error?: string } = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Не вдалося видалити фото.");
        return;
      }
      setImages((current) => current.filter((entry) => entry.id !== image.id));
    } catch {
      setError("Не вдалося видалити фото.");
    }
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

  const imageColors = Array.from(
    new Set(
      draft.variants
        .map((variant) => variant.color.trim())
        .filter(Boolean),
    ),
  );

  return (
    <form className="mt-8 grid gap-8" onSubmit={submit}>
      <section className="grid gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-2 sm:p-7">
        <h2 className="text-lg font-medium sm:col-span-2">
          Основна інформація
        </h2>
        <Input
          id="product-name"
          label="Назва товару"
          required
          maxLength={200}
          value={draft.name}
          onChange={(event) => {
            const name = event.target.value;
            setDraft((current) => ({
              ...current,
              name,
              ...(!slugTouched ? { slug: makeSlug(name) } : {}),
            }));
          }}
        />
        <Input
          id="product-slug"
          label="Посилання (slug)"
          required
          maxLength={200}
          hint="Латинські літери, цифри та дефіси"
          value={draft.slug}
          onChange={(event) => update("slug", event.target.value.toLowerCase())}
          onBlur={() => setSlugTouched(true)}
        />
        <div className="grid gap-1.5">
          <label htmlFor="product-category" className="text-sm font-medium">
            Категорія
          </label>
          <select
            id="product-category"
            required
            value={draft.category_id}
            onChange={(event) => update("category_id", event.target.value)}
            className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-sm focus:border-focus focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="product-price"
          label="Основна ціна / від, ₴"
          type="number"
          min="0"
          step="0.01"
          required
          value={draft.price}
          onChange={(event) => {
            const price = event.target.value;
            setDraft((current) => ({
              ...current,
              price,
              variants: current.variants.map((variant) =>
                variant.price === "" ? { ...variant, price } : variant,
              ),
            }));
          }}
        />
        <Input
          id="product-old-price"
          label="Стара ціна, ₴"
          type="number"
          min="0"
          step="0.01"
          value={draft.old_price}
          onChange={(event) => update("old_price", event.target.value)}
          hint="Залиште порожнім, якщо знижки немає"
        />
        <Textarea
          id="product-description"
          label="Опис"
          className="sm:col-span-2"
          maxLength={10000}
          value={draft.description}
          onChange={(event) => update("description", event.target.value)}
        />
        <Textarea
          id="product-composition"
          label="Склад"
          maxLength={2000}
          value={draft.composition}
          onChange={(event) => update("composition", event.target.value)}
        />
        <Textarea
          id="product-care"
          label="Догляд"
          maxLength={2000}
          value={draft.care_instructions}
          onChange={(event) => update("care_instructions", event.target.value)}
        />
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <Toggle
            label="Опублікувати в магазині"
            checked={draft.is_published}
            onChange={(checked) => update("is_published", checked)}
          />
          <Toggle
            label="Товар доступний для замовлення"
            checked={draft.is_available}
            onChange={(checked) => update("is_available", checked)}
          />
          <Toggle
            label="Позначити як новинку"
            checked={draft.is_new}
            onChange={(checked) => update("is_new", checked)}
          />
          <Toggle
            label="Показувати серед рекомендованих"
            checked={draft.is_featured}
            onChange={(checked) => update("is_featured", checked)}
          />
          <Toggle
            label="Позначити як акційний товар"
            checked={draft.is_sale}
            onChange={(checked) => update("is_sale", checked)}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-medium">Розміри, кольори та залишки</h2>
            <p className="mt-1 text-sm text-muted">
              Додайте окремий рядок для кожної комбінації розміру й кольору.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              update("variants", [...draft.variants, newVariant(draft.price)])
            }
          >
            <Plus size={15} aria-hidden="true" /> Додати варіант
          </Button>
        </div>
        <div className="mt-5 grid gap-4">
          {draft.variants.map((variant, index) => (
            <div
              key={variant.id ?? variant.sku}
              className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_0.8fr_0.7fr_0.8fr_auto]"
            >
              <Input
                id={`variant-size-${index}`}
                label="Розмір"
                required
                maxLength={40}
                value={variant.size}
                onChange={(event) =>
                  updateVariant(index, { size: event.target.value })
                }
                placeholder="M"
              />
              <Input
                id={`variant-color-${index}`}
                label="Колір"
                required
                maxLength={80}
                value={variant.color}
                onChange={(event) =>
                  updateVariant(index, { color: event.target.value })
                }
                placeholder="Чорний"
              />
              <div className="grid gap-1.5">
                <label
                  htmlFor={`variant-color-hex-${index}`}
                  className="text-sm font-medium"
                >
                  Відтінок
                </label>
                <input
                  id={`variant-color-hex-${index}`}
                  type="color"
                  value={variant.color_hex}
                  onChange={(event) =>
                    updateVariant(index, { color_hex: event.target.value })
                  }
                  className="h-11 w-full cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface p-1"
                />
              </div>
              <Input
                id={`variant-stock-${index}`}
                label="Залишок"
                type="number"
                min="0"
                max="100000"
                step="1"
                required
                value={variant.stock}
                onChange={(event) =>
                  updateVariant(index, { stock: event.target.value })
                }
              />
              <Input
                id={`variant-price-${index}`}
                label="Ціна, ₴"
                type="number"
                min="0"
                step="0.01"
                required
                value={variant.price}
                onChange={(event) =>
                  updateVariant(index, { price: event.target.value })
                }
              />
              <div className="flex items-end justify-between gap-3 lg:justify-end">
                <label className="mb-3 inline-flex items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={variant.is_available}
                    onChange={(event) =>
                      updateVariant(index, {
                        is_available: event.target.checked,
                      })
                    }
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  Активний
                </label>
                <button
                  type="button"
                  aria-label="Прибрати варіант"
                  disabled={draft.variants.length === 1}
                  onClick={() =>
                    update(
                      "variants",
                      draft.variants.filter((_, row) => row !== index),
                    )
                  }
                  className="mb-2 grid size-9 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger disabled:opacity-40"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
              <Input
                id={`variant-sku-${index}`}
                label="Артикул (SKU)"
                required
                maxLength={80}
                className="sm:col-span-2 lg:col-span-3"
                value={variant.sku}
                onChange={(event) =>
                  updateVariant(index, { sku: event.target.value })
                }
              />
            </div>
          ))}
        </div>
      </section>

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
              chooseImages(event.target.files);
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
                    alt={image.alt || draft.name}
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
                        setImages((current) =>
                          current.map((entry) =>
                            entry.id === image.id
                              ? {
                                  ...entry,
                                  color: event.target.value || null,
                                }
                              : entry,
                          ),
                        )
                      }
                      className="min-h-9 rounded border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-focus"
                    >
                      <option value="">Усі кольори</option>
                      {imageColors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    aria-label={`Опис фото ${index + 1}`}
                    value={image.alt}
                    onChange={(event) =>
                      setImages((current) =>
                        current.map((entry) =>
                          entry.id === image.id
                            ? { ...entry, alt: event.target.value }
                            : entry,
                        ),
                      )
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
                      onClick={() => moveImage(index, -1)}
                      className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Перемістити фото нижче"
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                      className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-muted disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Видалити фото"
                      onClick={() => void deleteImage(image)}
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
                    setNewFiles((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, color: event.target.value || null }
                          : item,
                      ),
                    )
                  }
                  className="min-h-9 rounded border border-border bg-surface px-2 text-xs outline-none focus:border-focus"
                >
                  <option value="">Усі кольори</option>
                  {imageColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Прибрати ${entry.file.name}`}
                  onClick={() =>
                    setNewFiles((current) =>
                      current.filter((_, row) => row !== index),
                    )
                  }
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {error ? (
        <p
          className="rounded-md border border-danger/30 bg-surface p-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="rounded-md border border-border bg-surface p-3 text-sm text-emerald-700"
          role="status"
        >
          {notice}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden="true" /> До списку товарів
        </Link>
        <Button
          type="submit"
          loading={saving}
          loadingLabel="Зберігаємо товар"
          size="lg"
        >
          Зберегти товар
        </Button>
      </div>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-10 items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[var(--color-accent)]"
      />
      {label}
    </label>
  );
}
