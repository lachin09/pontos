import {
  Camera,
  Link2,
  MessageCircle,
  Music2,
  Phone,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { ContactLink } from "@/lib/content/contact-links";

export type { ContactLink };

// Kept out of the client menu module so server components can use it too.
export const contactIcons: Record<ContactLink["kind"], LucideIcon> = {
  phone: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  instagram: Camera,
  tiktok: Music2,
  custom: Link2,
};
