import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function getActiveAdminSession() {
  const supabase = await createSupabaseAuthServerClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") return null;

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !profile) return null;
  return { supabase, userId };
}
