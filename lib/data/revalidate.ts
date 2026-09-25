import { revalidateTag } from "next/cache";
import type { CacheTag } from "@/lib/data/cache-tags";

// Admins expect to see their edit on the storefront right away, so the next
// request refetches instead of serving the stale copy.
export function revalidateStorefront(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}
