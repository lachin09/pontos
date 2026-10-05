import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/client";
import { LOCALES, LOCALE_TAGS } from "@/lib/i18n/config";
import { languageAlternates } from "@/lib/i18n/metadata";
import { getI18n } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
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
  const { t, locale } = await getI18n();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.title, template: "%s | PONTOS" },
    description: t.meta.description,
    alternates: languageAlternates("/", locale),
    openGraph: { siteName: "PONTOS", locale: LOCALE_TAGS[locale] },
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
        <Analytics />
      </body>
    </html>
  );
}
