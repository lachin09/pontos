"use client";

import { ExternalLink, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RichText } from "@/components/content/rich-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { adminSettingsApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { INFO_PAGE_TEMPLATES } from "@/lib/content/store-info-templates";
import {
  INFO_PAGES,
  INFO_PAGE_SLUGS,
  type InfoPageSlug,
  type SellerInfo,
  type StoreInfo,
} from "@/lib/validators/store-info";

const SELLER_FIELDS: {
  key: keyof SellerInfo;
  label: string;
  placeholder: string;
  type?: string;
}[] = [
  {
    key: "legalName",
    label: "Продавець",
    placeholder: "ФОП Прізвище Ім’я По батькові",
  },
  { key: "taxId", label: "РНОКПП / ЄДРПОУ", placeholder: "1234567890" },
  { key: "address", label: "Адреса", placeholder: "Місто, вулиця, будинок" },
  {
    key: "phone",
    label: "Телефон",
    placeholder: "+380 97 123 45 67",
    type: "tel",
  },
  {
    key: "email",
    label: "E-mail",
    placeholder: "shop@example.com",
    type: "email",
  },
  {
    key: "workingHours",
    label: "Графік роботи",
    placeholder: "Пн–Пт 10:00–19:00",
  },
];

/** Unfilled template spots such as "[телефон]". */
const countPlaceholders = (text: string) =>
  (text.match(/\[[^\]\n]{1,80}\]/g) ?? []).length;

export function AdminStoreInfoEditor({
  initialInfo,
}: {
  initialInfo: StoreInfo;
}) {
  const [info, setInfo] = useState(initialInfo);
  const [savedInfo, setSavedInfo] = useState(initialInfo);
  const [activePage, setActivePage] = useState<InfoPageSlug>("offer");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = JSON.stringify(info) !== JSON.stringify(savedInfo);

  // Warn before leaving with unsaved text.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const change = (next: StoreInfo) => {
    setInfo(next);
    setSaved(false);
    setMessage(null);
  };
  const setSeller = (key: keyof SellerInfo, value: string) =>
    change({ ...info, seller: { ...info.seller, [key]: value } });
  const setPage = (slug: InfoPageSlug, value: string) =>
    change({ ...info, pages: { ...info.pages, [slug]: value } });

  const save = async () => {
    setBusy(true);
    setMessage(null);
    setSaved(false);
    try {
      await adminSettingsApi.saveStoreInfo(info);
      setSavedInfo(info);
      setSaved(true);
    } catch (error) {
      setMessage(errorMessage(error, "Не вдалося зберегти інформацію."));
    } finally {
      setBusy(false);
    }
  };

  const pageText = info.pages[activePage];
  const placeholders = countPlaceholders(pageText);
  const isPublished = Boolean(savedInfo.pages[activePage].trim());

  return (
    <div className="mt-8 grid gap-8">
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-medium">Дані продавця</h2>
        <p className="mt-1 text-sm text-muted">
          Показуються в підвалі сайту, на сторінках «Про магазин» і «Публічна
          оферта».
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SELLER_FIELDS.map((field) => (
            <Input
              key={field.key}
              id={`seller-${field.key}`}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              value={info.seller[field.key]}
              disabled={busy}
              onChange={(event) => setSeller(field.key, event.target.value)}
            />
          ))}
        </div>
        <div className="mt-4">
          <Textarea
            id="seller-bankDetails"
            label="Реквізити для оплати переказом"
            hint="Не показуються на сайті. Telegram-бот надсилає їх покупцю, коли ви підтверджуєте замовлення з оплатою переказом."
            placeholder={
              "Отримувач: ФОП Прізвище І. П.\nIBAN: UA00 0000 0000 0000 0000 0000 000\nРНОКПП: 1234567890"
            }
            rows={4}
            maxLength={1000}
            value={info.seller.bankDetails}
            disabled={busy}
            onChange={(event) => setSeller("bankDetails", event.target.value)}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-medium">Сторінки для покупців</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Сторінка з’являється на сайті й у підвалі, щойно в ній є текст.
          Порожні сторінки приховані. Шаблони — це чернетки, а не юридична
          консультація: замініть усе в [квадратних дужках] і перевірте текст
          перед публікацією.
        </p>

        <div
          role="group"
          aria-label="Сторінки"
          className="scrollbar-none -mx-1 mt-5 flex gap-2 overflow-x-auto px-1"
        >
          {INFO_PAGE_SLUGS.map((slug) => {
            const hasText = Boolean(info.pages[slug].trim());
            return (
              <button
                key={slug}
                type="button"
                aria-pressed={slug === activePage}
                onClick={() => setActivePage(slug)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${slug === activePage ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
              >
                <span
                  className={`size-2 rounded-full ${hasText ? "bg-success" : "bg-border"}`}
                  aria-hidden="true"
                />
                {INFO_PAGES[slug].title}
                <span className="sr-only">
                  {hasText ? " (є текст)" : " (порожня)"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {pageText.trim() ? null : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                setPage(activePage, INFO_PAGE_TEMPLATES[activePage])
              }
            >
              <FileText size={14} aria-hidden="true" /> Вставити шаблон
            </Button>
          )}
          {isPublished ? (
            <Link
              href={`/info/${activePage}`}
              target="_blank"
              className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-medium text-accent hover:text-accent-hover"
            >
              Відкрити на сайті <ExternalLink size={13} aria-hidden="true" />
            </Link>
          ) : null}
          {placeholders > 0 ? (
            <p className="text-xs text-highlight" role="status">
              Незаповнених місць у [дужках]: {placeholders}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium">
            Текст сторінки «{INFO_PAGES[activePage].title}»
            <textarea
              value={pageText}
              disabled={busy}
              maxLength={30000}
              rows={22}
              onChange={(event) => setPage(activePage, event.target.value)}
              className="min-h-80 w-full resize-y rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-3 font-mono text-[0.8rem] font-normal leading-6 text-foreground focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/15"
            />
            <span className="text-xs font-normal text-muted">
              Порожній рядок — новий абзац. «## » на початку рядка — заголовок.
              «- » — пункт списку.
            </span>
          </label>
          <div className="min-w-0">
            <p className="mb-1.5 text-sm font-medium">Попередній перегляд</p>
            <div className="max-h-[36rem] overflow-y-auto rounded-[var(--radius-control)] border border-dashed border-border p-5">
              {pageText.trim() ? (
                <RichText source={pageText} />
              ) : (
                <p className="text-sm text-muted">
                  Сторінка порожня й не показується на сайті.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 -mx-page flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/95 px-page py-4 backdrop-blur">
        {message ? (
          <p className="mr-auto text-sm text-danger" role="alert">
            {message}
          </p>
        ) : saved ? (
          <p className="mr-auto text-sm text-success" role="status">
            Збережено. Зміни вже на сайті.
          </p>
        ) : dirty ? (
          <p className="mr-auto text-sm text-muted">Є незбережені зміни</p>
        ) : null}
        <Button
          type="button"
          onClick={() => void save()}
          loading={busy}
          disabled={!dirty}
        >
          Зберегти
        </Button>
      </div>
    </div>
  );
}
