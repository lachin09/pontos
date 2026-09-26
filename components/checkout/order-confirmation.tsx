import { ArrowRight, Check, Send } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { OrderConfirmation as Confirmation } from "@/lib/api/storefront";
import { formatPrice } from "@/lib/utils/format";

export function OrderConfirmation({
  confirmation,
}: {
  confirmation: Confirmation;
}) {
  const payOnDelivery = confirmation.paymentStatus === "cash_on_delivery";
  return (
    <section
      className="max-w-2xl rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-9"
      aria-labelledby="confirmation-heading"
      role="status"
    >
      <span className="grid size-14 animate-rise place-items-center rounded-full bg-accent text-white">
        <Check size={26} aria-hidden="true" />
      </span>
      <h2 id="confirmation-heading" className="mt-6 text-3xl">
        Замовлення оформлено
      </h2>
      <p className="mt-2 text-sm text-muted">
        Номер замовлення{" "}
        <strong className="text-foreground">#{confirmation.orderNumber}</strong>
        . Ми зв’яжемося з вами за вказаним номером телефону.
      </p>
      <div className="mt-6 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2">
        <span className="text-muted">До сплати за товари</span>
        <strong className="sm:text-right">
          {formatPrice(confirmation.total)}
        </strong>
        <span className="text-muted">Доставка</span>
        <span className="sm:text-right">
          Оплачується перевізнику при отриманні
        </span>
        <span className="text-muted">Оплата</span>
        <span className="sm:text-right">
          {payOnDelivery ? "При отриманні" : "Переказ на рахунок"}
        </span>
      </div>
      <p className="mt-4 text-sm text-muted">
        {confirmation.paymentStatus === "pending"
          ? "Реквізити для переказу узгодимо з вами телефоном."
          : "Оплатіть замовлення під час отримання посилки."}
      </p>
      {confirmation.telegramUrl ? (
        <div className="mt-6 rounded-[var(--radius-card)] bg-surface-muted p-4 sm:p-5">
          <p className="text-sm font-medium">
            Отримуйте статус замовлення в Telegram
          </p>
          <p className="mt-1 text-sm text-muted">
            Надішлемо підтвердження
            {confirmation.paymentStatus === "pending"
              ? ", реквізити для оплати"
              : ""}{" "}
            і повідомимо, коли посилку відправлять. Безкоштовно.
          </p>
          <a
            href={confirmation.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({
              className: "mt-4 bg-[#229ED9] hover:bg-[#1c8cc2]",
            })}
          >
            <Send size={16} aria-hidden="true" /> Отримати підтвердження в
            Telegram
          </a>
        </div>
      ) : null}
      <Link
        className={buttonClasses({
          size: "lg",
          variant: confirmation.telegramUrl ? "outline" : "primary",
          className: "mt-7",
        })}
        href="/catalog"
      >
        Продовжити покупки <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
