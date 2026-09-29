import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
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

export const metadata: Metadata = {
  title: { default: "PONTOS — адміністрування", template: "%s | PONTOS" },
  robots: { index: false, follow: false },
};

/** Root layout for the admin area, which stays in Ukrainian. */
export default function BackofficeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="uk"
      className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
