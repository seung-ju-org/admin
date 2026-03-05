import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { authOptions } from "@/lib/auth";
import { getLocale, getMessages } from "@/lib/i18n";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  const locale = getLocale(cookieStore.get("locale")?.value);
  const messages = getMessages(locale);

  return (
    <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="absolute right-6 top-6 z-30 flex items-center gap-2">
        <ThemeToggle
          label={messages.common.theme}
          names={{
            en: { light: "Light", system: "System", dark: "Dark" },
            ko: { light: "라이트", system: "시스템", dark: "다크" },
            ja: { light: "ライト", system: "システム", dark: "ダーク" },
          }[locale]}
        />
        <LanguageSwitcher
          label={messages.common.language}
          locale={locale}
          names={{
            en: "English",
            ko: "한국어",
            ja: "日本語",
          }}
        />
      </div>

      <div className="bg-muted relative hidden h-full flex-col p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20">
          <BrandLogo iconSize={36} onDark wordmarkWidth={160} />
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <LoginForm locale={locale} messages={messages.login} />
        </div>
      </div>
    </div>
  );
}
