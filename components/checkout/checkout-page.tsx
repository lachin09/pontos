"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_METHODS, PAYMENT_METHODS } from "@/lib/constants/order";
import { checkoutSchema, type CheckoutData } from "@/lib/validators/checkout";
import { formatPrice } from "@/lib/utils/format";
import { useCartStore } from "@/stores/cart.store";
import { useCheckoutStore } from "@/stores/checkout.store";
import { Skeleton } from "@/components/ui/skeleton";

const deliveryLabels = {
  nova_poshta: "Нова пошта",
  ukrposhta: "Укрпошта",
  courier: "Кур’єр",
} as const;

const paymentLabels = {
  bank_transfer: "Переказ на рахунок",
  cash_on_delivery: "Оплата при отриманні",
} as const;

const initialValues: CheckoutData = {
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  deliveryMethod: "nova_poshta",
  deliveryAddress: "",
  paymentMethod: "bank_transfer",
  comment: "",
};

export function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const savedData = useCheckoutStore((state) => state.data);
  const setData = useCheckoutStore((state) => state.setData);
  const clearCheckout = useCheckoutStore((state) => state.clear);
  const clearCart = useCartStore((state) => state.clearCart);
  const [reviewing, setReviewing] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    orderNumber: number;
    total: number;
    paymentStatus: "pending" | "cash_on_delivery";
  } | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutData>({
    defaultValues: savedData ?? initialValues,
    mode: "onBlur",
  });

  if (!hasHydrated) {
    return (
      <div
        className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-10"
        aria-label="Завантаження оформлення"
      >
        <Skeleton className="h-9 w-64" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[560px] w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-[1440px] place-items-center px-page py-16 text-center">
        <div>
          <ShoppingBag
            className="mx-auto text-accent"
            size={30}
            aria-hidden="true"
          />
          <h1 className="mt-4 text-2xl font-medium">Кошик порожній</h1>
          <p className="mt-2 text-sm text-muted">
            Додайте товари, щоб перейти до оформлення.
          </p>
          <Link
            className="mt-5 inline-block text-sm underline underline-offset-4"
            href="/catalog"
          >
            До каталогу
          </Link>
        </div>
      </div>
    );
  }

  const validateField = (name: FieldPath<CheckoutData>) => (value: unknown) => {
    const fieldSchema = checkoutSchema.shape[name];
    const result = fieldSchema.safeParse(value);
    return (
      result.success || result.error.issues[0]?.message || "Перевірте це поле"
    );
  };

  const onSubmit = async (data: CheckoutData) => {
    const result = checkoutSchema.safeParse(data);
    if (!result.success) return;
    setData(result.data);
    setOrderError(null);
    const key = crypto.randomUUID();
    setIdempotencyKey(key);
    setReviewing(true);
  };

  const placeOrder = async () => {
    if (!savedData || placingOrder || items.length === 0) return;
    setPlacingOrder(true);
    setOrderError(null);
    try {
      const key = idempotencyKey ?? crypto.randomUUID();
      setIdempotencyKey(key);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          customer: savedData,
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });
      const result: {
        orderNumber?: number;
        total?: number;
        paymentStatus?: "pending" | "cash_on_delivery";
        error?: string;
      } = await response.json();

      if (!response.ok || result.orderNumber == null || result.total == null || !result.paymentStatus) {
        setOrderError(result.error ?? "Не вдалося оформити замовлення. Спробуйте ще раз.");
        return;
      }

      setConfirmation({
        orderNumber: result.orderNumber,
        total: result.total,
        paymentStatus: result.paymentStatus,
      });
      clearCart();
      clearCheckout();
      setIdempotencyKey(null);
    } catch {
      setOrderError("Не вдалося оформити замовлення через з’єднання. Спробуйте ще раз.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="mx-auto min-h-[60vh] max-w-[1440px] px-page py-10 sm:py-14">
      <div className="mb-8 border-b border-border pb-6">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted">
          PONTOS · essentials
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">
          Оформлення замовлення
        </h1>
        <p className="mt-2 text-sm text-muted">
          Заповніть дані для зв’язку та доставки.
        </p>
      </div>

      {confirmation ? (
        <section className="max-w-2xl rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:p-9" aria-labelledby="confirmation-heading" role="status">
          <span className="grid size-12 place-items-center rounded-full bg-accent/10 text-accent"><Check size={24} aria-hidden="true" /></span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">PONTOS · essentials</p>
          <h2 id="confirmation-heading" className="mt-2 text-2xl font-medium">Замовлення оформлено</h2>
          <p className="mt-2 text-sm text-muted">Номер замовлення <strong className="text-foreground">#{confirmation.orderNumber}</strong>. Ми зв’яжемося з вами за вказаним номером телефону.</p>
          <div className="mt-6 grid gap-3 border-y border-border py-4 text-sm sm:grid-cols-2">
            <span className="text-muted">До сплати за товари</span>
            <strong className="sm:text-right">{formatPrice(confirmation.total)}</strong>
            <span className="text-muted">Доставка</span>
            <span className="sm:text-right">Оплачується перевізнику при отриманні</span>
            <span className="text-muted">Оплата</span>
            <span className="sm:text-right">{confirmation.paymentStatus === "cash_on_delivery" ? "При отриманні" : "Переказ на рахунок"}</span>
          </div>
          <p className="mt-4 text-sm text-muted">{confirmation.paymentStatus === "pending" ? "Реквізити для переказу узгодимо з вами телефоном." : "Оплатіть замовлення під час отримання посилки."}</p>
          <Link className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm text-background" href="/catalog">Продовжити покупки <ArrowRight size={16} /></Link>
        </section>
      ) : reviewing && savedData ? (
        <section
          className="max-w-2xl rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-7"
          aria-labelledby="review-heading"
        >
          <h2 id="review-heading" className="text-xl font-medium">
            Перевірте дані
          </h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Покупець</dt>
              <dd className="mt-1">
                {savedData.firstName} {savedData.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Телефон</dt>
              <dd className="mt-1">{savedData.phone}</dd>
            </div>
            <div>
              <dt className="text-muted">Місто</dt>
              <dd className="mt-1">{savedData.city}</dd>
            </div>
            <div>
              <dt className="text-muted">Доставка</dt>
              <dd className="mt-1">
                {deliveryLabels[savedData.deliveryMethod]} ·{" "}
                {savedData.deliveryAddress}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Оплата</dt>
              <dd className="mt-1">{paymentLabels[savedData.paymentMethod]}</dd>
            </div>
            {savedData.comment ? (
              <div className="sm:col-span-2">
                <dt className="text-muted">Коментар</dt>
                <dd className="mt-1">{savedData.comment}</dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-5 rounded-md bg-surface-muted p-3 text-sm text-muted">
            Доставка оплачується окремо перевізнику під час отримання. Підсумкова вартість доставки залежить від тарифу перевізника.
          </p>
          {orderError ? <p className="mt-4 text-sm text-danger" role="alert">{orderError}</p> : null}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button type="button" loading={placingOrder} loadingLabel="Оформлюємо замовлення" onClick={placeOrder}>
              Підтвердити замовлення · {formatPrice(subtotal)}
            </Button>
          <Button
            type="button"
            variant="outline"
            disabled={placingOrder}
            onClick={() => {
              setReviewing(false);
              setOrderError(null);
              setIdempotencyKey(null);
            }}
          >
            <ArrowLeft size={16} /> Повернутися до редагування
          </Button>
          </div>
        </section>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="order-2 grid gap-7 lg:order-1"
          >
            <section
              className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-2 sm:p-6"
              aria-labelledby="customer-heading"
            >
              <h2
                id="customer-heading"
                className="text-lg font-medium sm:col-span-2"
              >
                Контактні дані
              </h2>
              <Input
                id="firstName"
                label="Ім’я"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register("firstName", {
                  validate: validateField("firstName"),
                })}
              />
              <Input
                id="lastName"
                label="Прізвище"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register("lastName", {
                  validate: validateField("lastName"),
                })}
              />
              <Input
                id="phone"
                label="Телефон"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+380…"
                error={errors.phone?.message}
                {...register("phone", { validate: validateField("phone") })}
              />
            </section>

            <section
              className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-2 sm:p-6"
              aria-labelledby="delivery-heading"
            >
              <h2
                id="delivery-heading"
                className="text-lg font-medium sm:col-span-2"
              >
                Доставка
              </h2>
              <Input
                id="city"
                label="Місто"
                autoComplete="address-level2"
                error={errors.city?.message}
                {...register("city", { validate: validateField("city") })}
              />
              <Select
                id="deliveryMethod"
                label="Спосіб доставки"
                options={DELIVERY_METHODS.map((value) => ({
                  value,
                  label: deliveryLabels[value],
                }))}
                error={errors.deliveryMethod?.message}
                {...register("deliveryMethod", {
                  validate: validateField("deliveryMethod"),
                })}
              />
              <Input
                id="deliveryAddress"
                label="Відділення або адреса"
                className="sm:col-span-2"
                autoComplete="street-address"
                error={errors.deliveryAddress?.message}
                {...register("deliveryAddress", {
                  validate: validateField("deliveryAddress"),
                })}
              />
            </section>

            <fieldset className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
              <legend className="px-1 text-lg font-medium">Оплата</legend>
              {PAYMENT_METHODS.map((value) => (
                <Radio
                  key={value}
                  id={`payment-${value}`}
                  value={value}
                  label={paymentLabels[value]}
                  description={
                    value === "bank_transfer"
                      ? "Реквізити для переказу надійдуть після створення замовлення."
                      : "Оплата під час отримання посилки."
                  }
                  {...register("paymentMethod", {
                    validate: validateField("paymentMethod"),
                  })}
                />
              ))}
              {errors.paymentMethod?.message ? (
                <p className="text-xs text-danger">
                  {errors.paymentMethod.message}
                </p>
              ) : null}
            </fieldset>

            <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
              <Textarea
                id="comment"
                label="Коментар до замовлення"
                hint="Необов’язково, до 500 символів"
                maxLength={500}
                error={errors.comment?.message}
                {...register("comment", { validate: validateField("comment") })}
              />
            </section>
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              loadingLabel="Перевіряємо дані"
              className="w-full sm:w-fit"
            >
              Перевірити дані <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </form>

          <aside className="order-1 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6 lg:order-2 lg:sticky lg:top-28">
            <h2 className="text-lg font-medium">Ваше замовлення</h2>
            <ul className="mt-5 grid gap-4 border-b border-border pb-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded bg-surface-muted">
                    {item.productImage ? (
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.productName}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {item.color} · {item.size} · {item.quantity} шт.
                    </p>
                  </div>
                  <span className="text-sm tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between gap-3 text-sm">
              <span className="text-muted">Доставка</span>
              <span className="text-right">Оплачується перевізнику окремо</span>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-border pt-4">
              <span className="font-medium">Разом за товари</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>
            <Link
              href="/cart"
              className="mt-5 inline-flex items-center gap-2 text-xs text-muted underline underline-offset-4 hover:text-foreground"
            >
              <ArrowLeft size={14} aria-hidden="true" /> Повернутися до кошика
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
