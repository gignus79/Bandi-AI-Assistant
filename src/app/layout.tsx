import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { itIT } from "@clerk/localizations";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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
    <ClerkProvider
      localization={itIT}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="it" suppressHydrationWarning>
        <body className="min-h-screen antialiased">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
