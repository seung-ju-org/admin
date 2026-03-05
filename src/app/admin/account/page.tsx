import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AccountProfileForm } from "@/components/admin/account-profile-form";
import { UserSessionsPanel } from "@/components/admin/user-sessions-panel";
import { authOptions } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale);

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.common.account}</h1>
        <p className="text-sm text-muted-foreground">{messages.common.signedInAs}: {session.user.username}</p>
      </div>

      <AccountProfileForm
        userId={user.id}
        initial={{
          username: user.username,
          name: user.name ?? "",
          email: user.email ?? "",
        }}
        messages={messages.usersManager}
        title={messages.usersManager.edit}
      />

      <UserSessionsPanel
        currentSessionId={session.sessionId}
        locale={locale}
        messages={messages.usersManager}
        userId={user.id}
      />
    </div>
  );
}
