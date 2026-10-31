import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import { MåleenhetProvider } from "./lib/i18n/MåleenhetContext";

const inter = localFont({
  src: [
    { path: "./fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = localFont({
  src: [
    { path: "./fonts/plus-jakarta-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/plus-jakarta-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lille",
  description: "Your baby's language, your hands",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable} h-full overflow-x-hidden antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-inter), sans-serif', paddingTop: 'env(safe-area-inset-top)' }}>
  <LanguageProvider>
    <MåleenhetProvider>{children}</MåleenhetProvider>
  </LanguageProvider>
</body>
    </html>
  );
}
