import { NotificationsMenu } from "@/components/admin/notifications-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader({
  title,
  languageLabel,
  themeLabel,
  notifications,
  locale,
}: {
  title: string
  languageLabel: string
  themeLabel: string
  notifications: {
    notifications: string
    noNotifications: string
    viewMonitoring: string
  }
  locale: "en" | "ko" | "ja"
}) {
  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="min-w-0 truncate text-base font-medium">{title}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <NotificationsMenu labels={notifications} />
          <div className="hidden items-center gap-1 sm:gap-2 md:flex">
            <ThemeToggle
              label={themeLabel}
              names={{
                en: { light: "Light", system: "System", dark: "Dark" },
                ko: { light: "라이트", system: "시스템", dark: "다크" },
                ja: { light: "ライト", system: "システム", dark: "ダーク" },
              }[locale]}
            />
            <LanguageSwitcher
              label={languageLabel}
              locale={locale}
              names={{
                en: "English",
                ko: "한국어",
                ja: "日本語",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
