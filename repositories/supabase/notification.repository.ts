import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { NotificationRepository } from "@/repositories/notification.repository";

export function createSupabaseNotificationRepository(
  client: SupabaseClient<Database>,
): NotificationRepository {
  return {
    async listRecent(limit) {
      const { data, error } = await client
        .from("admin_notifications")
        .select(
          "id, order_id, order_number, title, message, is_read, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    async countUnread() {
      const { count, error } = await client
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
    async markRead(id) {
      const { data, error } = await client
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  };
}
