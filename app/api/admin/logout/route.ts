import { assertSameOrigin, json, route } from "@/lib/http/route";
import { signOutAdmin } from "@/lib/supabase/admin-session";

export const POST = route(async (request) => {
  assertSameOrigin(request);
  await signOutAdmin();
  return json({ ok: true });
});
