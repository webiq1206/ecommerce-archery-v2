import { Link, useLocation } from "wouter";
import { Package, ShoppingBag, Users, LayoutDashboard, Target, LogOut, ChevronRight, Truck, Building2 } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const nav = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Distributors", href: "/admin/distributors", icon: Building2 },
    { name: "Fulfillment", href: "/admin/fulfillment", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-secondary-foreground flex flex-col hidden md:flex shrink-0 border-r border-border/10">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <Target className="w-8 h-8 text-primary" />
            <span className="font-display font-bold text-xl tracking-wide uppercase">
              APEX<span className="text-primary">ADMIN</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {nav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20" 
                    : "text-secondary-foreground/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-secondary-foreground/70 hover:text-white transition-colors rounded-xl hover:bg-white/5">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0 shadow-sm">
          <h2 className="font-display font-bold text-xl text-foreground">
            {nav.find(n => n.href === location)?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
              AD
            </div>
          </div>
        </header>
        
        {/* Content Scroll */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
