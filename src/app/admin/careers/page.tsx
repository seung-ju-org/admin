import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { CareersManager } from "@/components/admin/careers-manager";
import { authOptions } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";

export default async function AdminCareersPage() {
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
      <h1 className="text-2xl font-semibold tracking-tight">{messages.careersPage.title}</h1>
      <CareersManager locale={locale} messages={messages.careersManager} />
    </div>
  );
}
