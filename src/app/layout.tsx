import type { Metadata } from "next";
import { AppAmbientBackground } from "@/components/layout/AppAmbientBackground";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bandi AI Assistant",
  description: "Analisi documentazione bandi di finanziamento con AI",
  icons: { icon: "/icon-app.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased dark:bg-[#070212]">
        <AppAmbientBackground />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
