import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError, forbidden, unauthorized } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import type { AdminLoginData } from "@/lib/validators/admin-auth";

/** The single rule for admin access: an active row in admin_profiles. */
async function isActiveAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return !error && Boolean(data);
}

export async function getActiveAdminSession() {
  const supabase = await createSupabaseAuthServerClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") return null;
  if (!(await isActiveAdmin(supabase, userId))) return null;
  return { supabase, userId };
}

/** Signs in and keeps the session only if the account is an active admin. */
export async function signInAdmin(credentials: AdminLoginData) {
  let supabase: SupabaseClient<Database>;
  let userId: string | undefined;
  try {
    supabase = await createSupabaseAuthServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (!error) userId = data.user?.id;
  } catch {
    throw new AppError("Не вдалося увійти. Спробуйте трохи пізніше.", 503);
  }
  if (!userId) throw unauthorized("Невірна пошта або пароль.");

  if (!(await isActiveAdmin(supabase, userId))) {
    await supabase.auth.signOut();
    throw forbidden(
      "Цей обліковий запис не має доступу до панелі адміністратора.",
    );
  }
}

export async function signOutAdmin() {
  try {
    const supabase = await createSupabaseAuthServerClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    throw new AppError("Не вдалося вийти з облікового запису.", 503);
  }
}
