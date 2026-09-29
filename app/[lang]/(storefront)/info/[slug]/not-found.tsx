import { NotFoundContent } from "@/components/layout/not-found-content";
import { getI18n } from "@/lib/i18n/server";

/** Shown for info pages that do not exist or have no text yet. */
export default async function InfoPageNotFound() {
  const { locale } = await getI18n();
  return <NotFoundContent locale={locale} />;
}
