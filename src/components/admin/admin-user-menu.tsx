"use client";

import { ChevronsUpDown, LogOut, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  username: string;
  accountLabel: string;
  logoutLabel: string;
  className?: string;
  compact?: boolean;
};

export function AdminUserMenu({
  username,
  accountLabel,
  logoutLabel,
  className,
  compact = false,
}: Props) {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={className}
          type="button"
          variant="ghost"
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!compact ? (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{username}</span>
                <span className="truncate text-xs text-muted-foreground">{accountLabel}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" side="top">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <UserCircle2 className="size-4 text-muted-foreground" />
            <span>{accountLabel}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="size-4" />
          {logoutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
