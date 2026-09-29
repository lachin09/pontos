import {
  Camera,
  Link2,
  MessageCircle,
  Music2,
  Phone,
  Send,
  type LucideIcon,
} from "lucide-react";

export type ContactLink = {
  kind: "phone" | "whatsapp" | "telegram" | "instagram" | "tiktok" | "custom";
  label: string;
  href: string;
  detail?: string;
};

// Kept out of the client menu module so server components can use it too.
export const contactIcons: Record<ContactLink["kind"], LucideIcon> = {
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  instagram: Camera,
  tiktok: Music2,
  custom: Link2,
};
