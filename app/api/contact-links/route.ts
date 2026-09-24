import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  CONTACT_LINKS_SETTING_KEY,
  contactLinksSchema,
} from "@/lib/validators/contact-links";

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", CONTACT_LINKS_SETTING_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Не вдалося завантажити контакти." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = contactLinksSchema.safeParse(data?.value ?? { links: [] });
  return NextResponse.json(
    { links: parsed.success ? parsed.data.links : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
