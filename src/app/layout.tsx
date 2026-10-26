import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";
import { authRequired } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outreach Dashboard",
  description: "Track leads, emails, mockups and clients for a web design outreach business.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Providers>
          <AppShell authEnabled={authRequired()}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
