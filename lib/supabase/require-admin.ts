import { redirect } from "next/navigation";
import { getActiveAdminSession } from "@/lib/supabase/admin-session";

export async function requireAdmin() {
  const session = await getActiveAdminSession();
  if (!session) redirect("/admin/login?reason=unauthorized");
  return { userId: session.userId };
}
