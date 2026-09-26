import type { SupabaseClient } from "@supabase/supabase-js";
import { conflict } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";
import { PG } from "@/lib/supabase/db-error";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage/image-storage";
import type {
  OrderAdminRepository,
  OrderNotificationRepository,
  OrderPlacementRepository,
} from "@/repositories/order.repository";
import type { NotifiableOrder } from "@/types/order";

/** Needs the service-role client: the RPC prices items and reserves stock. */
export function createSupabaseOrderPlacementRepository(
  client: SupabaseClient<Database>,
): OrderPlacementRepository {
  return {
    async place({ customer, items }, idempotencyKey) {
      const { data, error } = await client.rpc("create_order_secure", {
        p_idempotency_key: idempotencyKey,
        p_customer: {
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone,
          city: customer.city,
          delivery_method: customer.deliveryMethod,
          delivery_address: customer.deliveryAddress,
          delivery_country_code: customer.deliveryCountryCode,
          delivery_postal_code: customer.deliveryPostalCode,
          // Branch lookup is off: customers type the branch or address.
          nova_poshta_division_id: null,
          nova_poshta_division_name: null,
          nova_poshta_division_category: null,
          payment_method: customer.paymentMethod,
          comment: customer.comment,
        },
        p_items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
        // Order items keep a snapshot of the product image URL.
        p_public_storage_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`,
      });

      if (error?.code === PG.raiseException) {
        throw conflict(
          "На жаль, наявність товару змінилася. Оновіть кошик і спробуйте ще раз.",
        );
      }
      const order = data?.[0];
      if (error || !order) {
        console.error("Order creation failed", error?.code ?? "empty response");
        throw new Error("Order creation failed");
      }
      return {
        orderNumber: order.order_number,
        total: Number(order.total),
        paymentStatus: order.payment_status,
        wasCreated: order.was_created,
      };
    },
  };
}

export function createSupabaseOrderAdminRepository(
  client: SupabaseClient<Database>,
): OrderAdminRepository {
  return {
    async list(limit) {
      const { data, error } = await client
        .from("orders")
        .select(
          "id, order_number, first_name, last_name, phone, city, total, status, payment_status, created_at, order_items(count)",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data.map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        firstName: order.first_name,
        lastName: order.last_name,
        phone: order.phone,
        city: order.city,
        total: Number(order.total),
        status: order.status,
        paymentStatus: order.payment_status,
        createdAt: order.created_at,
        itemCount: order.order_items[0]?.count ?? 0,
      }));
    },

    async getStatuses(id) {
      const { data, error } = await client
        .from("orders")
        .select("status, payment_status")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data
        ? { status: data.status, paymentStatus: data.payment_status }
        : null;
    },

    async getDetails(id) {
      const [{ data: order, error }, { data: history }] = await Promise.all([
        client
          .from("orders")
          .select(
            "id, order_number, first_name, last_name, phone, city, delivery_method, delivery_address, delivery_country_code, delivery_postal_code, nova_poshta_division_id, nova_poshta_division_name, nova_poshta_division_category, payment_method, payment_status, status, comment, subtotal, delivery_price, total, created_at, order_items(id, product_name, product_image, size, color, price, quantity, subtotal)",
          )
          .eq("id", id)
          .maybeSingle(),
        client
          .from("order_status_history")
          .select(
            "id, old_status, new_status, old_payment_status, new_payment_status, created_at",
          )
          .eq("order_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (error || !order) return null;
      return {
        id: order.id,
        orderNumber: order.order_number,
        firstName: order.first_name,
        lastName: order.last_name,
        phone: order.phone,
        city: order.city,
        deliveryMethod: order.delivery_method,
        deliveryAddress: order.delivery_address,
        deliveryCountryCode: order.delivery_country_code,
        deliveryPostalCode: order.delivery_postal_code,
        novaPoshtaDivisionId: order.nova_poshta_division_id,
        novaPoshtaDivisionName: order.nova_poshta_division_name,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        status: order.status,
        comment: order.comment,
        subtotal: Number(order.subtotal),
        deliveryPrice: Number(order.delivery_price),
        total: Number(order.total),
        createdAt: order.created_at,
        items: order.order_items.map((item) => ({
          id: item.id,
          productName: item.product_name,
          productImage: item.product_image,
          size: item.size,
          color: item.color,
          price: Number(item.price),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        })),
        history: (history ?? []).map((entry) => ({
          id: entry.id,
          oldStatus: entry.old_status,
          newStatus: entry.new_status,
          oldPaymentStatus: entry.old_payment_status,
          newPaymentStatus: entry.new_payment_status,
          createdAt: entry.created_at,
        })),
      };
    },

    async updateStatus(id, status, paymentStatus) {
      const { data, error } = await client.rpc("update_order_admin", {
        p_order_id: id,
        p_status: status,
        p_payment_status: paymentStatus,
      });
      if (error) throw error;
      return Boolean(data);
    },
  };
}

const notifiableColumns =
  "id, order_number, public_token, first_name, last_name, phone, city, delivery_country_code, delivery_method, delivery_address, payment_method, payment_status, status, comment, subtotal, telegram_chat_id, order_items(product_name, size, color, quantity, subtotal)";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Needs the service-role client: orders have no public read policy. */
export function createSupabaseOrderNotificationRepository(
  client: SupabaseClient<Database>,
): OrderNotificationRepository {
  async function findOne(
    column: "id" | "order_number" | "public_token",
    value: string | number,
  ): Promise<NotifiableOrder | null> {
    const { data, error } = await client
      .from("orders")
      .select(notifiableColumns)
      .eq(column, value)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      orderNumber: data.order_number,
      publicToken: data.public_token,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      city: data.city,
      deliveryCountryCode: data.delivery_country_code,
      deliveryMethod: data.delivery_method,
      deliveryAddress: data.delivery_address,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      status: data.status,
      comment: data.comment,
      subtotal: Number(data.subtotal),
      telegramChatId: data.telegram_chat_id,
      items: data.order_items.map((item) => ({
        productName: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
    };
  }

  return {
    findById: (id) =>
      UUID.test(id) ? findOne("id", id) : Promise.resolve(null),
    findByNumber: (orderNumber) => findOne("order_number", orderNumber),
    findByToken: (token) =>
      UUID.test(token) ? findOne("public_token", token) : Promise.resolve(null),
    async setTelegramChat(orderId, chatId) {
      const { error } = await client
        .from("orders")
        .update({ telegram_chat_id: chatId })
        .eq("id", orderId);
      if (error) throw error;
    },
  };
}
