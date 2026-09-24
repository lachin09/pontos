"use client";

import { useEffect, useState } from "react";
import {
  FloatingContactMenu,
  type ContactLink,
} from "@/components/layout/floating-contact-menu";
import type { ContactLinkRecord } from "@/lib/validators/contact-links";

function normalizedPhone(value: string) {
  const enteredDigits = value.replace(/\D/g, "");
  if (enteredDigits.startsWith("00")) return enteredDigits.slice(2);
  if (enteredDigits.startsWith("0") && enteredDigits.length === 10) {
    return `38${enteredDigits}`;
  }
  return enteredDigits;
}

function profileUrl(value: string, domain: string) {
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/^http:/i, "https:");
  }
  return `https://${domain}/${value.replace(/^@/, "")}`;
}

function resolveLinks(records: ContactLinkRecord[]): ContactLink[] {
  return records.flatMap((record) => {
    const value = record.value.trim();
    if (record.type === "phone") {
      const digits = normalizedPhone(value);
      return digits
        ? [
            {
              kind: "phone" as const,
              label: record.label,
              href: `tel:+${digits}`,
              detail: value,
            },
          ]
        : [];
    }
    if (record.type === "whatsapp") {
      const digits = normalizedPhone(value);
      return digits
        ? [
            {
              kind: "whatsapp" as const,
              label: record.label,
              href: `https://wa.me/${digits}`,
              detail: value,
            },
          ]
        : [];
    }
    if (record.type === "telegram") {
      return [
        {
          kind: "telegram" as const,
          label: record.label,
          href: profileUrl(value, "t.me"),
          detail: value,
        },
      ];
    }
    if (record.type === "instagram") {
      return [
        {
          kind: "instagram" as const,
          label: record.label,
          href: profileUrl(value, "www.instagram.com"),
          detail: value,
        },
      ];
    }
    if (record.type === "tiktok") {
      const href = /^https?:\/\//i.test(value)
        ? profileUrl(value, "www.tiktok.com")
        : `https://www.tiktok.com/@${value.replace(/^@/, "")}`;
      return [
        { kind: "tiktok" as const, label: record.label, href, detail: value },
      ];
    }
    return [
      {
        kind: "custom" as const,
        label: record.label,
        href: value,
        detail: value,
      },
    ];
  });
}

export function FloatingContactButton() {
  const [links, setLinks] = useState<ContactLink[]>([]);

  useEffect(() => {
    let active = true;
    void fetch("/api/contact-links", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { links?: ContactLinkRecord[] } | null) => {
        if (active && Array.isArray(data?.links)) {
          setLinks(resolveLinks(data.links));
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  return <FloatingContactMenu links={links} />;
}
