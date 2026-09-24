import { z } from "zod";

export const CONTACT_LINKS_SETTING_KEY = "public_contact_links";

export const contactLinkTypeSchema = z.enum([
  "phone",
  "whatsapp",
  "telegram",
  "instagram",
  "tiktok",
  "custom",
]);

export const contactLinkSchema = z
  .object({
    id: z.string().uuid(),
    type: contactLinkTypeSchema,
    label: z.string().trim().min(1).max(60),
    value: z.string().trim().min(1).max(240),
  })
  .superRefine((link, context) => {
    if (link.type === "phone" || link.type === "whatsapp") {
      const digits = link.value.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        context.addIssue({
          code: "custom",
          path: ["value"],
          message: "Вкажіть коректний номер телефону.",
        });
      }
      return;
    }

    if (link.type === "custom" || /^https?:\/\//i.test(link.value)) {
      try {
        const url = new URL(link.value);
        if (!(["https:", "http:"].includes(url.protocol) && url.hostname)) {
          throw new Error("Invalid URL");
        }
      } catch {
        context.addIssue({
          code: "custom",
          path: ["value"],
          message: "Вкажіть коректне посилання, що починається з https://.",
        });
      }
      return;
    }

    if (!/^@?[a-zA-Z0-9._-]{1,50}$/.test(link.value)) {
      context.addIssue({
        code: "custom",
        path: ["value"],
        message: "Вкажіть ім’я профілю або повне посилання.",
      });
    }
  });

export const contactLinksSchema = z.object({
  links: z.array(contactLinkSchema).max(50),
});

export type ContactLinkType = z.infer<typeof contactLinkTypeSchema>;
export type ContactLinkRecord = z.infer<typeof contactLinkSchema>;
