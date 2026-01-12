import type { Metadata } from "next";
import { Noto_Sans_Bengali, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider";
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
  title: {
    default: "ব্যাকরণ - Byakoron | Bangla Grammar & Spelling Tool",
    template: "%s | ব্যাকরণ - Byakoron",
  },
  description:
    "A powerful Bangla grammar and spelling correction tool powered by BNTK. Check your Bangla text for spelling errors with intelligent phonetic suggestions.",
  keywords: [
    "bangla",
    "bengali",
    "grammar",
    "spelling",
    "correction",
    "bntk",
    "nlp",
    "বাংলা",
    "ব্যাকরণ",
    "বানান",
    "বানান পরীক্ষা",
    "spell checker",
    "bangla spell checker",
  ],
  authors: [{ name: "BNTK Team" }],
  creator: "BNTK",
  publisher: "BNTK",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://app.bntk.xyz"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ব্যাকরণ - Byakoron | Bangla Grammar & Spelling Tool",
    description:
      "Check and correct Bangla spelling with intelligent suggestions powered by BNTK.",
    url: "/",
    siteName: "ব্যাকরণ - Byakoron",
    locale: "bn_BD",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ব্যাকরণ - Bangla Grammar & Spelling Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ব্যাকরণ - Byakoron | Bangla Grammar & Spelling Tool",
    description:
      "Check and correct Bangla spelling with intelligent suggestions powered by BNTK.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-light.svg", type: "image/svg+xml" },
    ],
    apple: "/logo-light.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className={`${notoSansBengali.variable} ${jetbrainsMono.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
