import Link from "next/link";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import { getLocale, getMessages } from "@/lib/i18n";

export default async function NotFoundPage() {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale).errorPages;

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{messages.rootNotFound.title}</h1>
      <p className="text-sm text-muted-foreground">{messages.rootNotFound.description}</p>
      <Button asChild>
        <Link href="/login">{messages.rootNotFound.moveToLogin}</Link>
      </Button>
    </main>
  );
}
