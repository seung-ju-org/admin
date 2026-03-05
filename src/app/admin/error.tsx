"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">관리자 페이지 오류</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          요청 처리 중 문제가 발생했습니다. 다시 시도해주세요.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset} type="button">
            다시 시도
          </Button>
          <Button asChild type="button" variant="outline">
            <Link href="/admin">대시보드로 이동</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
