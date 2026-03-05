import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-muted-foreground">
        주소를 다시 확인하거나 로그인 페이지로 이동해주세요.
      </p>
      <Button asChild>
        <Link href="/login">로그인으로 이동</Link>
      </Button>
    </main>
  );
}
