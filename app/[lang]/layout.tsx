import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/client";
import { LOCALES, LOCALE_TAGS } from "@/lib/i18n/config";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: t.meta.title, template: "%s | PONTOS" },
    description: t.meta.description,
    alternates: languageAlternates("/"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const { locale } = await getI18n();
  return (
    <html
      lang={LOCALE_TAGS[locale]}
      className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
