"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";
import { getLocale, getMessages } from "@/lib/i18n";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(
    () => () => undefined,
    () => getLocale(document.documentElement.lang),
    () => "ko",
  );

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const messages = useMemo(() => getMessages(locale).errorPages, [locale]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{messages.rootError.title}</h1>
      <p className="text-sm text-muted-foreground">{messages.rootError.description}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset} type="button">
          {messages.rootError.retry}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/login">{messages.rootError.moveToLogin}</Link>
        </Button>
      </div>
    </main>
  );
}
