import { cookies } from "next/headers";
import Link from "next/link";

import { DashboardMonitoringSummaryCard } from "@/components/admin/dashboard-monitoring-summary-card";
import { RecentUsersTable } from "@/components/admin/recent-users-table";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale, getMessages, toLocaleCode } from "@/lib/i18n";
import { getMonitoringSnapshot } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale);

  const [totalUsers, adminUsers, latestUser, recentUsers, monitoring] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "ADMIN", deletedAt: null } }),
    prisma.user.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    getMonitoringSnapshot(),
  ]);

  const standardUsers = totalUsers - adminUsers;
  return (
    <div className="space-y-4 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{messages.adminDashboard.title}</h1>
          <p className="text-sm text-muted-foreground">{messages.adminDashboard.description}</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/admin/users">{messages.adminDashboard.manageUsers}</Link>
        </Button>
      </div>

      <DashboardMonitoringSummaryCard
        initialSnapshot={monitoring}
        labels={{
          monitoring: messages.common.monitoring,
          openMonitoring: messages.common.monitoring,
          overallStatus: messages.monitoringPage.overallStatus,
          activeAlerts: messages.monitoringPage.activeAlerts,
          lastUpdated: messages.monitoringPage.lastUpdated,
          healthy: messages.monitoringPage.healthy,
          warning: messages.monitoringPage.warning,
          critical: messages.monitoringPage.critical,
          unknown: messages.monitoringPage.unknown,
        }}
        locale={locale}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {messages.adminDashboard.cards.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {messages.adminDashboard.cards.adminUsers}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{adminUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {messages.adminDashboard.cards.standardUsers}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{standardUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {messages.adminDashboard.cards.latestSignup}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {latestUser ? <LocalDateTime locale={toLocaleCode(locale)} value={latestUser.createdAt.toISOString()} /> : "-"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{messages.adminDashboard.recentUsersTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentUsersTable
            emptyLabel={messages.adminDashboard.emptyUsers}
            locale={locale}
            messages={messages.usersManager}
            users={recentUsers.map((user) => ({
              ...user,
              createdAt: user.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
