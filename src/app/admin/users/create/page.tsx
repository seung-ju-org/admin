import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CreateUserForm } from "@/components/admin/create-user-form";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";

export default async function CreateUserPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale);

  return (
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.usersPage.createTitle}</h1>
        <Button asChild className="w-full sm:w-auto" variant="outline">
          <Link href="/admin/users">{messages.usersManager.backToList}</Link>
        </Button>
      </div>
      <CreateUserForm messages={messages.usersManager} />
    </div>
  );
}
