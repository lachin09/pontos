import { FloatingContactMenu } from "@/components/layout/floating-contact-menu";
import { resolveContactLinks } from "@/lib/content/contact-links";
import { getContactLinks } from "@/lib/data/storefront";
import type { ContactLinkRecord } from "@/lib/validators/contact-links";

export async function FloatingContactButton() {
  let records: ContactLinkRecord[] = [];
  try {
    records = await getContactLinks();
  } catch {
    // The contact menu is optional; the storefront still renders without it.
  }

  return <FloatingContactMenu links={resolveContactLinks(records)} />;
}
