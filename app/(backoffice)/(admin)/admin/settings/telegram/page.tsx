import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminTelegramSettings } from "@/components/admin/admin-telegram-settings";
import { requireAdminServices } from "@/lib/server/admin-services";
import { getTelegramStatus } from "@/lib/server/telegram-status";

export const metadata: Metadata = {
  title: "Telegram",
  robots: { index: false, follow: false },
};

export default async function AdminTelegramPage() {
  const services = await requireAdminServices();
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  const status = await getTelegramStatus(
    services.settings,
    `${protocol}://${host}`,
  ).catch(() => null);

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Магазин
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">
          Telegram-бот
        </h1>
        <p className="mt-2 text-sm text-muted">
          Безкоштовні підтвердження для покупців і сповіщення про нові
          замовлення для вас.
        </p>
      </div>
      {status ? (
        <AdminTelegramSettings initialStatus={status} />
      ) : (
        <p
          className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          Не вдалося перевірити налаштування бота.
        </p>
      )}
    </>
  );
}
