"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors w-full"
    >
      <LogOut className="w-4 h-4 shrink-0" />
      Sign Out
    </button>
  );
}
