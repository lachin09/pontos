import { normalizePhoneDigits } from "@/lib/utils/format";
import type { ContactLinkRecord } from "@/lib/validators/contact-links";

/** A contact link as saved in the admin, turned into something clickable. */
export type ContactLink = {
  kind: "phone" | "whatsapp" | "telegram" | "instagram" | "tiktok" | "custom";
  label: string;
  href: string;
  detail?: string;
};

function profileUrl(value: string, domain: string) {
  if (/^https?:\/\//i.test(value)) {
    return value.replace(/^http:/i, "https:");
  }
  return `https://${domain}/${value.replace(/^@/, "")}`;
}

export function resolveContactLinks(
  records: ContactLinkRecord[],
): ContactLink[] {
  return records.flatMap((record): ContactLink[] => {
    const value = record.value.trim();
    if (record.type === "phone") {
      const digits = normalizePhoneDigits(value);
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
      const digits = normalizePhoneDigits(value);
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
