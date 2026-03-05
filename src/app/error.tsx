"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">오류가 발생했습니다</h1>
      <p className="text-sm text-muted-foreground">
        요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={reset} type="button">
          다시 시도
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/login">로그인으로 이동</Link>
        </Button>
      </div>
    </main>
  );
}
