import type { CSSProperties } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { authOptions } from "@/lib/auth"
import { getLocale, getMessages } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  const cookieStore = await cookies()
  const locale = getLocale(cookieStore.get("locale")?.value)
  const messages = getMessages(locale)

  let user: { username: string; name: string | null; email: string | null } | null = null
  try {
    user = await prisma.user.findFirst({
      where: { id: session.user.id, deletedAt: null },
      select: { username: true, name: true, email: true },
    })
  } catch (error) {
    console.error("Failed to load admin layout user profile", error)
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar
        locale={locale}
        labels={{
          dashboard: messages.common.dashboard,
          users: messages.common.users,
          projects: messages.common.projects,
          careers: messages.common.careers,
          monitoring: messages.common.monitoring,
          account: messages.common.account,
          logout: messages.common.logout,
          language: messages.common.language,
          theme: messages.common.theme,
        }}
        user={{
          name: user?.name || user?.username || session.user.username,
          email: user?.email || "-",
          avatar: "",
        }}
      />
      <SidebarInset>
        <SiteHeader
          languageLabel={messages.common.language}
          notifications={{
            notifications: messages.common.notifications,
            noNotifications: messages.common.noNotifications,
            viewMonitoring: messages.common.viewMonitoring,
          }}
          locale={locale}
          themeLabel={messages.common.theme}
          title={messages.common.dashboard}
        />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
