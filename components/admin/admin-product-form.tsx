"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminProductsApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { ProductDetailsSection } from "@/components/admin/product-form/product-details-section";
import { ProductTranslationsSection } from "@/components/admin/product-form/product-translations-section";
import { ProductImagesSection } from "@/components/admin/product-form/product-images-section";
import { ProductVariantsSection } from "@/components/admin/product-form/product-variants-section";
import {
  toProductInput,
  variantColors,
} from "@/components/admin/product-form/product-draft";
import { useProductDraft } from "@/components/admin/product-form/use-product-draft";
import { useProductImages } from "@/components/admin/product-form/use-product-images";
import type {
  ProductCategoryOption,
  ProductDraft,
  ProductImageDraft,
} from "@/components/admin/product-form/types";

export type {
  ProductCategoryOption,
  ProductImageDraft,
  ProductVariantDraft,
} from "@/components/admin/product-form/types";

interface AdminProductFormProps {
  categories: ProductCategoryOption[];
  initialProduct?: ProductDraft;
  initialImages?: ProductImageDraft[];
}

export function AdminProductForm({
  categories,
  initialProduct,
  initialImages = [],
}: AdminProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    draft,
    update,
    setName,
    setPrice,
    markSlugTouched,
    updateColor,
    addColor,
    removeColor,
  } = useProductDraft(categories, initialProduct);
  const productImages = useProductImages(initialImages, setError);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (draft.colors.some((color) => color.sizes.length === 0)) {
      setError("Оберіть хоча б один розмір для кожного кольору.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const input = toProductInput(draft);
      const result = draft.id
        ? await adminProductsApi.update(draft.id, input)
        : await adminProductsApi.create(input);
      if (!result.id) {
        setError("Перевірте заповнені поля та спробуйте ще раз.");
        return;
      }

      if (!draft.id) update("id", result.id);
      const imageDetailsSaved = await productImages.saveImageDetails(result.id);
      if (!imageDetailsSaved) {
        setError(
          "Товар збережено, але не вдалося оновити порядок або описи фото. Спробуйте зберегти ще раз.",
        );
        return;
      }

      const imagesUploaded = await productImages.uploadNewFiles(
        result.id,
        draft.name,
      );
      if (!imagesUploaded) {
        setError(
          "Товар уже збережено. Перевірте фото та спробуйте завантажити їх ще раз.",
        );
        return;
      }

      // A product that just went live is announced in the Telegram channel.
      let posted = false;
      if (input.is_published) {
        try {
          ({ posted } = await adminProductsApi.postToChannel(result.id, {
            force: false,
          }));
        } catch (error) {
          // Saving again retries: the product is still due for its post.
          setError(
            `Товар збережено, але не опубліковано в Telegram-каналі. ${errorMessage(error, "Спробуйте зберегти ще раз.")}`,
          );
          return;
        }
      }

      setNotice(
        posted
          ? "Зміни збережено. Товар опубліковано в Telegram-каналі."
          : "Зміни збережено.",
      );
      if (window.location.pathname.endsWith("/admin/products/new")) {
        router.replace(`/admin/products/${result.id}/edit`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (error) {
      setError(
        errorMessage(
          error,
          "Не вдалося з’єднатися із сервером. Спробуйте ще раз.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  /** Posts the product as it is saved now, even if it was posted before. */
  const postToChannel = async () => {
    if (
      !draft.id ||
      !window.confirm(
        "Опублікувати цей товар у Telegram-каналі? Допис побачать усі підписники.",
      )
    ) {
      return;
    }
    setPosting(true);
    setError(null);
    setNotice(null);
    try {
      await adminProductsApi.postToChannel(draft.id, { force: true });
      setNotice("Товар опубліковано в Telegram-каналі.");
    } catch (error) {
      setError(
        errorMessage(error, "Не вдалося опублікувати товар у Telegram-каналі."),
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <form className="mt-8 grid gap-8" onSubmit={submit}>
      <ProductDetailsSection
        categories={categories}
        draft={draft}
        update={update}
        onNameChange={setName}
        onPriceChange={setPrice}
        onSlugBlur={markSlugTouched}
      />

      <ProductTranslationsSection draft={draft} update={update} />

      <ProductVariantsSection
        colors={draft.colors}
        price={draft.price}
        onAdd={addColor}
        onChange={updateColor}
        onRemove={removeColor}
      />

      <ProductImagesSection
        images={productImages.images}
        newFiles={productImages.newFiles}
        productName={draft.name}
        colors={variantColors(draft.colors)}
        onChoose={(files) =>
          productImages.chooseImages(
            files,
            draft.colors[0]?.color.trim() || null,
          )
        }
        onImageChange={productImages.updateImage}
        onImageMove={productImages.moveImage}
        onImageDelete={(image) =>
          void productImages.deleteImage(draft.id, image)
        }
        onNewFileColorChange={productImages.setNewFileColor}
        onNewFileRemove={productImages.removeNewFile}
      />

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
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {draft.id ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              loading={posting}
              loadingLabel="Публікуємо в каналі"
              disabled={saving}
              onClick={() => void postToChannel()}
            >
              <Send size={15} aria-hidden="true" /> Опублікувати в каналі
            </Button>
          ) : null}
          <Button
            type="submit"
            loading={saving}
            loadingLabel="Зберігаємо товар"
            size="lg"
            disabled={posting}
          >
            Зберегти товар
          </Button>
        </div>
      </div>
    </form>
  );
}
