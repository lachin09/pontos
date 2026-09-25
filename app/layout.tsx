import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "PONTOS — одяг для щоденного ритму",
    template: "%s | PONTOS",
  },
  description:
    "Продуманий повсякденний одяг, комфортні силуети та спокійні кольори від PONTOS.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
