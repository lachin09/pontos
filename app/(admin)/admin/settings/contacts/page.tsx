import type { Metadata } from "next";
import { AdminContactLinksEditor } from "@/components/admin/admin-contact-links-editor";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  CONTACT_LINKS_SETTING_KEY,
  contactLinksSchema,
} from "@/lib/validators/contact-links";

export const metadata: Metadata = {
  title: "Контакти",
  robots: { index: false, follow: false },
};

export default async function AdminContactSettingsPage() {
  const supabase = await createSupabaseAuthServerClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("value")
    .eq("key", CONTACT_LINKS_SETTING_KEY)
    .maybeSingle();
  const parsed = contactLinksSchema.safeParse(data?.value ?? { links: [] });

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Магазин
        </p>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">Контакти</h1>
        <p className="mt-2 text-sm text-muted">
          Керуйте посиланнями у плаваючій кнопці зв’язку.
        </p>
      </div>
      {error ? (
        <p
          className="mt-8 rounded-md border border-danger/30 bg-surface p-4 text-sm text-danger"
          role="alert"
        >
          Не вдалося завантажити контакти.
        </p>
      ) : (
        <AdminContactLinksEditor
          initialLinks={parsed.success ? parsed.data.links : []}
        />
      )}
    </>
  );
}
