import type { Metadata } from "next";
import { Noto_Sans_Bengali, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-sans",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ব্যাকরণ - Byakoron | Bangla Grammar & Spelling Tool",
  description:
    "A powerful Bangla grammar and spelling correction tool powered by BNTK. Check your Bangla text for spelling errors with intelligent phonetic suggestions.",
  keywords: ["bangla", "bengali", "grammar", "spelling", "correction", "bntk", "nlp"],
  openGraph: {
    title: "ব্যাকরণ - Bangla Grammar Tool",
    description: "Check and correct Bangla spelling with intelligent suggestions",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body className={`${notoSansBengali.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
