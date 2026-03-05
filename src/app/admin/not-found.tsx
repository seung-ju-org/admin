import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminNotFoundPage() {
  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">관리자 페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-muted-foreground">요청한 관리자 경로가 존재하지 않습니다.</p>
      <Button asChild>
        <Link href="/admin">대시보드로 이동</Link>
      </Button>
    </div>
  );
}
