import Link from "next/link";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import { getLocale, getMessages } from "@/lib/i18n";

export default async function AdminNotFoundPage() {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale).errorPages;

  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold">{messages.adminNotFound.title}</h1>
      <p className="text-sm text-muted-foreground">{messages.adminNotFound.description}</p>
      <Button asChild>
        <Link href="/admin">{messages.adminNotFound.moveToDashboard}</Link>
      </Button>
    </div>
  );
}
