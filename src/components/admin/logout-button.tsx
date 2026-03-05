"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton({ label }: { label: string }) {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: "/login" })}
      size="sm"
      type="button"
      variant="outline"
    >
      <LogOut className="mr-1 size-4" />
      {label}
    </Button>
  );
}
