import { Inter, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

import { AppShell } from "../components/layout/app-shell";
import { QueryProvider } from "../components/providers/query-provider";
import { ToastProvider } from "../components/providers/toast-provider";
import { ThemeProvider } from "../components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VisualSprint",
  description:
    "Production-oriented multi-agent meeting intelligence for engineering teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
