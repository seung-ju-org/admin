"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UserPlus, Users } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  dashboardLabel: string;
  usersLabel: string;
  createUserLabel: string;
};

const items = [
  {
    href: "/admin",
    icon: Home,
    key: "dashboard" as const,
  },
  {
    href: "/admin/users",
    icon: Users,
    key: "users" as const,
  },
  {
    href: "/admin/users/create",
    icon: UserPlus,
    key: "createUser" as const,
  },
];

export function AdminNav({ dashboardLabel, usersLabel, createUserLabel }: Props) {
  const pathname = usePathname();

  const labels = {
    dashboard: dashboardLabel,
    users: usersLabel,
    createUser: createUserLabel,
  } as const;

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
              isActive && "bg-muted text-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon className="size-4" />
            {labels[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
