"use client";

import { CheckCircle2, CircleAlert, ExternalLink, Send } from "lucide-react";
import { useState } from "react";
import { Button, buttonClasses } from "@/components/ui/button";
import { adminTelegramApi } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import type { TelegramStatus } from "@/lib/validators/telegram";

function Step({
  done,
  title,
  children,
}: {
  done: boolean;
  title: string;
  children: React.ReactNode;
}) {
  const Icon = done ? CheckCircle2 : CircleAlert;
  return (
    <li className="grid gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-[auto_1fr] sm:p-6">
      <Icon
        size={22}
        className={done ? "text-success" : "text-highlight"}
        aria-hidden="true"
      />
      <div className="grid gap-3">
        <h2 className="text-lg font-medium">
          {title}
          <span className="sr-only">
            {done ? " — готово" : " — потрібна дія"}
          </span>
        </h2>
        {children}
      </div>
    </li>
  );
}

export function AdminTelegramSettings({
  initialStatus,
}: {
  initialStatus: TelegramStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ownerLink, setOwnerLink] = useState<string | null>(null);

  const refresh = async () => setStatus(await adminTelegramApi.status());

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    setMessage(null);
    try {
      await action();
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error, "Не вдалося виконати дію."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 grid gap-6">
      {message ? (
        <p
          className="rounded-md border border-danger/30 bg-surface p-3 text-sm text-danger"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      <ol className="grid gap-4">
        <Step done={status.configured} title="1. Бот створено">
          {status.configured ? (
            <p className="text-sm text-muted">
              Бот{" "}
              {status.username ? (
                <a
                  href={`https://t.me/${status.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:text-accent-hover"
                >
                  @{status.username}
                </a>
              ) : null}{" "}
              підключено до сайту.
            </p>
          ) : (
            <div className="grid gap-2 text-sm leading-6 text-muted">
              <p>
                Створіть бота в Telegram через{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent"
                >
                  @BotFather
                </a>{" "}
                (команда /newbot) і скопіюйте токен.
              </p>
              <p>
                У Vercel відкрийте проєкт → Settings → Environment Variables,
                додайте{" "}
                <code className="rounded bg-surface-muted px-1">
                  TELEGRAM_BOT_TOKEN
                </code>{" "}
                для Production і Preview та перезапустіть деплой.
              </p>
            </div>
          )}
        </Step>

        <Step
          done={status.webhookConnected}
          title="2. Бот отримує повідомлення"
        >
          <p className="text-sm text-muted">
            Telegram має надсилати повідомлення бота на{" "}
            <span className="break-all font-mono text-xs">
              {status.webhookUrl}
            </span>
          </p>
          {status.webhookError && !status.webhookConnected ? (
            <p className="text-xs text-danger">
              Помилка Telegram: {status.webhookError}
            </p>
          ) : null}
          <div>
            <Button
              type="button"
              variant={status.webhookConnected ? "outline" : "primary"}
              size="sm"
              disabled={!status.configured}
              loading={busy === "webhook"}
              onClick={() =>
                void run("webhook", adminTelegramApi.connectWebhook)
              }
            >
              {status.webhookConnected ? "Підключити ще раз" : "Підключити"}
            </Button>
          </div>
        </Step>

        <Step
          done={status.ownerChats > 0}
          title="3. Сповіщення про нові замовлення"
        >
          <p className="text-sm text-muted">
            {status.ownerChats > 0
              ? `Підключено чатів: ${status.ownerChats}. Кожне нове замовлення приходить туди одразу.`
              : "Відкрийте одноразове посилання на телефоні, де ви хочете отримувати нові замовлення, і натисніть «Start»."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={status.ownerChats > 0 ? "outline" : "primary"}
              disabled={!status.webhookConnected}
              loading={busy === "owner"}
              onClick={() =>
                void run("owner", async () =>
                  setOwnerLink((await adminTelegramApi.ownerLink()).url),
                )
              }
            >
              <Send size={14} aria-hidden="true" />
              {status.ownerChats > 0 ? "Додати ще чат" : "Створити посилання"}
            </Button>
            {status.ownerChats > 0 ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-muted hover:text-danger"
                loading={busy === "disconnect"}
                onClick={() => {
                  if (window.confirm("Відключити всі чати від сповіщень?")) {
                    void run("disconnect", adminTelegramApi.disconnectOwners);
                  }
                }}
              >
                Відключити всі
              </Button>
            ) : null}
          </div>
          {ownerLink ? (
            <a
              href={ownerLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({
                size: "sm",
                variant: "secondary",
                className: "w-fit",
              })}
            >
              Відкрити в Telegram <ExternalLink size={13} aria-hidden="true" />
            </a>
          ) : null}
        </Step>
      </ol>

      <section className="rounded-[var(--radius-card)] border border-dashed border-border p-5 text-sm leading-6 text-muted">
        <h2 className="font-medium text-foreground">Що отримують покупці</h2>
        <p className="mt-1">
          Після оформлення покупець бачить кнопку «Отримати підтвердження в
          Telegram». Бот надсилає підсумок замовлення, а потім — кожну зміну
          статусу, яку ви робите в адмінці. Якщо покупець обрав переказ, після
          підтвердження замовлення бот надішле реквізити з розділу «Інформація
          магазину».
        </p>
      </section>
    </div>
  );
}
