import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { GraphqlProvider } from "@/components/providers/apollo-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/lib/i18n";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);

  const metadataByLocale: Record<
    "en" | "ko" | "ja",
    { title: string; description: string }
  > = {
    en: {
      title: "Admin Console",
      description: "Portfolio and server operations admin dashboard",
    },
    ko: {
      title: "관리자 콘솔",
      description: "포트폴리오와 서버 운영을 관리하는 관리자 대시보드",
    },
    ja: {
      title: "管理コンソール",
      description: "ポートフォリオとサーバー運用を管理する管理ダッシュボード",
    },
  };

  return metadataByLocale[locale];
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <GraphqlProvider>
            {children}
            <Toaster />
          </GraphqlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
