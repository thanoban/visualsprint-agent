import { Inter } from "next/font/google";
import type { Metadata } from "next";

import { AppShell } from "../components/layout/app-shell";
import { QueryProvider } from "../components/providers/query-provider";
import { ToastProvider } from "../components/providers/toast-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="en" className={inter.variable}>
      <body>
        <QueryProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
