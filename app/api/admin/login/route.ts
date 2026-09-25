import { assertSameOrigin, json, readJson, route } from "@/lib/http/route";
import { signInAdmin } from "@/lib/supabase/admin-session";
import { adminLoginSchema } from "@/lib/validators/admin-auth";

export const POST = route(async (request) => {
  assertSameOrigin(request);
  const credentials = await readJson(request, adminLoginSchema, {
    message: "Перевірте введені дані.",
    invalidMessage: "Введіть коректну пошту та пароль.",
    requireJsonContentType: true,
  });
  await signInAdmin(credentials);
  return json({ ok: true });
});
