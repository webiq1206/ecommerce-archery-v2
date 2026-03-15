import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Heart, MapPin, Settings, LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

export const metadata: Metadata = {
  title: "My Account",
  robots: "noindex, nofollow",
};

const navItems = [
  { name: "Dashboard", href: "/account", icon: LayoutDashboard },
  { name: "Orders", href: "/account/orders", icon: ShoppingBag },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
  { name: "Addresses", href: "/account/addresses", icon: MapPin },
  { name: "Settings", href: "/account/settings", icon: Settings },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Mobile tab bar */}
        <div className="lg:hidden overflow-x-auto mb-8 -mx-4 px-4">
          <nav className="flex gap-2 pb-2 border-b border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 whitespace-nowrap transition-colors"
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Desktop side nav */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-6">
              {user && (
                <div className="px-4 pb-4 border-b border-white/5">
                  <p className="text-sm font-medium text-white truncate">{user.name ?? "Customer"}</p>
                  <p className="text-xs text-white/50 truncate">{user.email}</p>
                </div>
              )}
              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="pt-4 border-t border-white/5">
                <SignOutButton />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
