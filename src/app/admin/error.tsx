"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getLocale, getMessages, type Locale } from "@/lib/i18n";

export default function AdminError({
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
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">{messages.adminError.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{messages.adminError.description}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset} type="button">
            {messages.adminError.retry}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/admin">{messages.adminError.moveToDashboard}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
