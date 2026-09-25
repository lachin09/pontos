import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { SettingsRepository } from "@/repositories/settings.repository";

/**
 * store_settings has no public RLS policy: the storefront reads it with the
 * service-role client, the admin area with the signed-in admin's client.
 */
export function createSupabaseSettingsRepository(
  client: SupabaseClient<Database>,
): SettingsRepository {
  return {
    async get(key, schema, fallback) {
      const { data, error } = await client
        .from("store_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) {
        console.error(`Failed to load setting "${key}":`, error.message);
        throw new Error("Не вдалося завантажити налаштування.");
      }
      if (!data) return fallback;
      const parsed = schema.safeParse(data.value);
      return parsed.success ? parsed.data : fallback;
    },
    async save(key, value) {
      const { error } = await client
        .from("store_settings")
        .upsert({ key, value: value as Json }, { onConflict: "key" });
      if (error) throw error;
    },
  };
}
