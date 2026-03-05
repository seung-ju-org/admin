"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconInnerShadowTop,
  IconFolders,
  IconUsers,
  IconLayoutDashboard,
  IconActivityHeartbeat,
  IconBriefcase,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"

type Props = React.ComponentProps<typeof Sidebar> & {
  locale: "en" | "ko" | "ja"
  user: {
    name: string
    email: string
    avatar?: string
  }
  labels: {
    dashboard: string
    users: string
    projects: string
    careers: string
    monitoring: string
    account: string
    logout: string
    language: string
    theme: string
  }
}

export function AppSidebar({ locale, user, labels, ...props }: Props) {
  const pathname = usePathname()
  const [activeAlerts, setActiveAlerts] = React.useState<number | null>(null)
  const hasShownMonitoringLoadErrorToast = React.useRef(false)

  const navMain = [
    {
      title: labels.dashboard,
      url: "/admin",
      icon: IconLayoutDashboard,
    },
    {
      title: labels.users,
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: labels.projects,
      url: "/admin/projects",
      icon: IconFolders,
    },
    {
      title: labels.careers,
      url: "/admin/careers",
      icon: IconBriefcase,
    },
    {
      title: labels.monitoring,
      url: "/admin/monitoring",
      icon: IconActivityHeartbeat,
    },
  ]

  React.useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const response = await fetch("/api/admin/monitoring/summary", {
          method: "GET",
          cache: "no-store",
        })

        if (!response.ok) {
          if (!hasShownMonitoringLoadErrorToast.current) {
            toast.error("모니터링 요약을 불러오지 못했습니다.")
            hasShownMonitoringLoadErrorToast.current = true
          }
          return
        }

        const data = (await response.json()) as { alertCount?: unknown }
        if (!isMounted || typeof data.alertCount !== "number") {
          return
        }

        setActiveAlerts(data.alertCount)
        hasShownMonitoringLoadErrorToast.current = false
      } catch {
        if (!hasShownMonitoringLoadErrorToast.current) {
          toast.error("모니터링 요약을 불러오지 못했습니다.")
          hasShownMonitoringLoadErrorToast.current = true
        }
      }
    }

    void load()
    const timer = setInterval(() => {
      void load()
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [])

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/admin">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Seung Ju</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navMain.map((item) => {
            const isActive =
              item.url === "/admin"
                ? pathname === "/admin"
                : pathname === item.url || pathname.startsWith(`${item.url}/`)

            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                    {item.url === "/admin/monitoring" && activeAlerts !== null && activeAlerts > 0 ? (
                      <Badge
                        variant="destructive"
                        className="ml-auto min-w-5 justify-center px-1.5 py-0"
                      >
                        {activeAlerts > 99 ? "99+" : activeAlerts}
                      </Badge>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 pb-2 md:hidden">
          <ThemeToggle
            label={labels.theme}
            names={{
              en: { light: "Light", system: "System", dark: "Dark" },
              ko: { light: "라이트", system: "시스템", dark: "다크" },
              ja: { light: "ライト", system: "システム", dark: "ダーク" },
            }[locale]}
          />
          <LanguageSwitcher
            label={labels.language}
            locale={locale}
            names={{
              en: "English",
              ko: "한국어",
              ja: "日本語",
            }}
          />
        </div>
        <NavUser
          accountLabel={labels.account}
          logoutLabel={labels.logout}
          user={user}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
