"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getLocale, getMessages, type Locale } from "@/lib/i18n";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  const locale = useSyncExternalStore<Locale>(
    () => () => undefined,
    () => getLocale(document.documentElement.lang),
    () => "ko",
  );

  const messages = useMemo(() => getMessages(locale).errorPages, [locale]);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">{messages.globalError.title}</h1>
          <p className="text-sm text-muted-foreground">{messages.globalError.description}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} type="button">
              {messages.globalError.retry}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/login">{messages.globalError.moveToLogin}</Link>
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
