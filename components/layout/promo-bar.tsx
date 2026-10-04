import { Gift } from "lucide-react";
import { getFirstCustomerDiscount } from "@/lib/data/storefront";
import { fill } from "@/lib/i18n/dictionaries";
import { getI18n } from "@/lib/i18n/server";

/** The first-customer offer, shown on every page until an order claims it. */
export async function PromoBar() {
  const percent = await getFirstCustomerDiscount().catch(() => 0);
  if (percent <= 0) return null;
  const { t } = await getI18n();
  return (
    <div className="border-b border-gold/40 bg-highlight/10 text-foreground">
      <p className="mx-auto flex max-w-[1440px] items-center justify-center gap-2.5 px-page py-2.5 text-center text-xs sm:text-sm">
        <Gift size={16} className="shrink-0 text-gold" aria-hidden="true" />
        <span>{fill(t.promo.firstCustomer, { percent: String(percent) })}</span>
      </p>
    </div>
  );
}
