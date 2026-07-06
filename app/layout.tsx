import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import { MåleenhetProvider } from "./lib/i18n/MåleenhetContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Lille",
  description: "Your baby's language, your hands",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingTop: 'env(safe-area-inset-top)' }}>
  <LanguageProvider>
    <MåleenhetProvider>{children}</MåleenhetProvider>
  </LanguageProvider>
</body>
    </html>
  );
}