import { Header } from "@bntk/components/header";
import { ThemeProvider } from "@bntk/components/theme-provider";
import "./globals.css";

export const metadata = {
  title: "Bangla Toolkit",
  description: "A collection of tools for the Bangla language",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="pt-20 mt-20 px-2">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
