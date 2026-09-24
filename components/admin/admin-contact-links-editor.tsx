"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ContactLinkRecord,
  ContactLinkType,
} from "@/lib/validators/contact-links";

const typeOptions: { value: ContactLinkType; label: string }[] = [
  { value: "phone", label: "Телефон" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "custom", label: "Інше посилання" },
];

const defaultLabels: Record<ContactLinkType, string> = {
  phone: "Зателефонувати",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  instagram: "Instagram",
  tiktok: "TikTok",
  custom: "Інший контакт",
};

const placeholders: Record<ContactLinkType, string> = {
  phone: "+380 97 123 45 67",
  whatsapp: "+380 97 123 45 67",
  telegram: "@username або посилання на профіль",
  instagram: "@username або посилання на профіль",
  tiktok: "@username або посилання на профіль",
  custom: "https://example.com",
};

export function AdminContactLinksEditor({
  initialLinks,
}: {
  initialLinks: ContactLinkRecord[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const updateLink = (
    id: string,
    patch: Partial<Omit<ContactLinkRecord, "id">>,
  ) => {
    setLinks((current) =>
      current.map((link) => (link.id === id ? { ...link, ...patch } : link)),
    );
    setMessage(null);
    setSaved(false);
  };

  const addLink = () => {
    const type: ContactLinkType = "phone";
    setLinks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type,
        label: defaultLabels[type],
        value: "",
      },
    ]);
    setMessage(null);
    setSaved(false);
  };

  const save = async () => {
    setBusy(true);
    setMessage(null);
    setSaved(false);
    try {
      const response = await fetch("/api/admin/settings/contact-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) {
        setMessage(result.error ?? "Не вдалося зберегти контакти.");
        return;
      }
      setSaved(true);
    } catch {
      setMessage("Не вдалося з’єднатися із сервером.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Додайте телефони та профілі, які показуватимуться у плаваючій кнопці
          на сайті. Для WhatsApp введіть номер із кодом країни.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={addLink}
          disabled={busy || links.length >= 50}
        >
          <Plus size={16} aria-hidden="true" /> Додати контакт
        </Button>
      </div>

      {message ? (
        <p
          className="mb-4 rounded-md border border-danger/30 bg-surface p-3 text-sm text-danger"
          role="alert"
        >
          {message}
        </p>
      ) : null}
      {saved ? (
        <p
          className="mb-4 rounded-md border border-success/30 bg-surface p-3 text-sm text-success"
          role="status"
        >
          Контакти збережено.
        </p>
      ) : null}

      {links.length ? (
        <ul className="grid gap-3">
          {links.map((link) => (
            <li
              key={link.id}
              className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(10rem,1fr)_minmax(14rem,1.5fr)_auto] sm:items-end sm:p-5"
            >
              <label className="grid gap-1.5 text-sm font-medium">
                Канал
                <select
                  value={link.type}
                  disabled={busy}
                  onChange={(event) => {
                    const type = event.target.value as ContactLinkType;
                    updateLink(link.id, {
                      type,
                      label: defaultLabels[type],
                      value: "",
                    });
                  }}
                  className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-sm font-normal outline-none focus:border-focus"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Назва кнопки
                <input
                  value={link.label}
                  disabled={busy}
                  maxLength={60}
                  onChange={(event) =>
                    updateLink(link.id, { label: event.target.value })
                  }
                  className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-sm font-normal outline-none focus:border-focus"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                {link.type === "phone" || link.type === "whatsapp"
                  ? "Номер або посилання"
                  : "Посилання або ім’я профілю"}
                <input
                  type={
                    link.type === "phone" || link.type === "whatsapp"
                      ? "tel"
                      : link.type === "custom"
                        ? "url"
                        : "text"
                  }
                  value={link.value}
                  disabled={busy}
                  maxLength={240}
                  placeholder={placeholders[link.type]}
                  onChange={(event) =>
                    updateLink(link.id, { value: event.target.value })
                  }
                  className="min-h-11 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-sm font-normal outline-none focus:border-focus"
                />
              </label>

              <button
                type="button"
                aria-label={`Видалити контакт ${link.label}`}
                disabled={busy}
                onClick={() => {
                  setLinks((current) =>
                    current.filter((item) => item.id !== link.id),
                  );
                  setMessage(null);
                  setSaved(false);
                }}
                className="grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-danger disabled:opacity-50"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface p-8 text-center">
          <p className="font-medium">Контактів поки немає</p>
          <p className="mt-1 text-sm text-muted">
            Додайте номер телефону, месенджер або соціальну мережу.
          </p>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <Button type="button" onClick={() => void save()} loading={busy}>
          Зберегти контакти
        </Button>
      </div>
    </section>
  );
}
