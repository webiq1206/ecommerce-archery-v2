import Link from "next/link";
import { Package, ShoppingBag, Users, LayoutDashboard, Target, LogOut, Truck, Building2 } from "lucide-react";

const nav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Distributors", href: "/admin/distributors", icon: Building2 },
  { name: "Fulfillment", href: "/admin/fulfillment", icon: Truck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex -mt-20 pt-20">
      <aside className="w-64 bg-secondary text-secondary-foreground flex-col hidden md:flex shrink-0 border-r border-border/10 sticky top-20 h-[calc(100vh-5rem)]">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <Target className="w-8 h-8 text-primary" />
            <span className="font-display font-normal text-xl tracking-[0.25em] uppercase">
              APEX<span className="text-primary">ADMIN</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-auto">
          {nav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-secondary-foreground/70 hover:bg-white/5 hover:text-white"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 w-full text-left text-secondary-foreground/70 hover:text-white transition-colors rounded-xl hover:bg-white/5">
            <LogOut className="w-5 h-5" />
            Back to Store
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-[calc(100vh-5rem)]">
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
