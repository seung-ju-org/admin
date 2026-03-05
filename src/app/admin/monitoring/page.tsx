import { cookies } from "next/headers";

import { MonitoringOverview } from "@/components/admin/monitoring-overview";
import { getLocale, getMessages } from "@/lib/i18n";
import { getMonitoringSnapshot } from "@/lib/monitoring";

export default async function AdminMonitoringPage() {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale);
  const initialSnapshot = await getMonitoringSnapshot();

  return (
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <MonitoringOverview
        initialSnapshot={initialSnapshot}
        labels={messages.monitoringPage}
        locale={locale}
      />
    </div>
  );
}
