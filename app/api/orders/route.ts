import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createOrderSchema } from "@/lib/validators/order";

const idempotencySchema = z.string().uuid();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Запит не вдалося перевірити." }, { status: 403 });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Некоректний формат запиту." }, { status: 415 });
  }

  const idempotencyKey = idempotencySchema.safeParse(
    request.headers.get("idempotency-key"),
  );
  if (!idempotencyKey.success) {
    return NextResponse.json({ error: "Не вдалося створити замовлення. Спробуйте ще раз." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некоректний формат замовлення." }, { status: 400 });
  }

  const input = createOrderSchema.safeParse(body);
  if (!input.success) {
    return NextResponse.json({ error: "Перевірте контактні дані та товари в кошику." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("create_order_secure", {
      p_idempotency_key: idempotencyKey.data,
      p_customer: {
        first_name: input.data.customer.firstName,
        last_name: input.data.customer.lastName,
        phone: input.data.customer.phone,
        email: input.data.customer.email,
        city: input.data.customer.city,
        delivery_method: input.data.customer.deliveryMethod,
        delivery_address: input.data.customer.deliveryAddress,
        payment_method: input.data.customer.paymentMethod,
        comment: input.data.customer.comment,
      },
      p_items: input.data.items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      p_public_storage_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")}/storage/v1/object/public/product-images/`,
      p_admin_notification_email: process.env.ADMIN_ORDER_EMAIL?.trim() || "",
    });

    if (error || !data?.[0]) {
      if (error?.code === "P0001") {
        return NextResponse.json(
          { error: "На жаль, наявність товару змінилася. Оновіть кошик і спробуйте ще раз." },
          { status: 409 },
        );
      }
      console.error("Order creation failed", error?.code ?? "empty response");
      return NextResponse.json(
        { error: "Не вдалося оформити замовлення. Спробуйте ще раз або зв’яжіться з нами." },
        { status: 500 },
      );
    }

    const order = data[0];
    if (order.was_created) {
      const { dispatchPendingNotifications } = await import("@/lib/notifications/dispatch");
      await dispatchPendingNotifications({ orderNumber: order.order_number });
    }
    return NextResponse.json(
      {
        orderNumber: order.order_number,
        total: Number(order.total),
        paymentStatus: order.payment_status,
      },
      { status: order.was_created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Order service unavailable", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json(
      { error: "Не вдалося оформити замовлення. Спробуйте трохи пізніше." },
      { status: 500 },
    );
  }
}
