import Link from "next/link";
import {
  Package, ShoppingBag, Users, LayoutDashboard, Target, LogOut, Truck, Building2,
  FileText, Tag, Settings, BarChart3, Megaphone, BookOpen, Globe, Plus, Search, Bell,
} from "lucide-react";

const navSections = [
  {
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Catalog",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "Categories", href: "/admin/categories", icon: Tag },
      { name: "Collections", href: "/admin/collections", icon: Globe },
      { name: "Brands", href: "/admin/brands", icon: Target },
    ],
  },
  {
    label: "Orders",
    items: [
      { name: "All Orders", href: "/admin/orders", icon: ShoppingBag },
      { name: "Fulfillment", href: "/admin/fulfillment", icon: Truck },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Distributors", href: "/admin/distributors", icon: Building2 },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Blog Posts", href: "/admin/content/blog", icon: FileText },
      { name: "Buying Guides", href: "/admin/content/guides", icon: BookOpen },
      { name: "Pages", href: "/admin/content/pages", icon: Globe },
    ],
  },
  {
    label: "Promotions",
    items: [
      { name: "Discounts", href: "/admin/promotions/discounts", icon: Megaphone },
      { name: "Subscribers", href: "/admin/promotions/subscribers", icon: Users },
    ],
  },
  {
    label: "Reports",
    items: [
      { name: "Revenue", href: "/admin/reports/revenue", icon: BarChart3 },
      { name: "Products", href: "/admin/reports/products", icon: Package },
      { name: "Distributors", href: "/admin/reports/distributors", icon: Building2 },
    ],
  },
  {
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex -mt-20 pt-20">
      <aside className="w-[260px] bg-secondary text-secondary-foreground flex-col hidden md:flex shrink-0 border-r border-border/10 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            <span className="font-display font-normal text-lg tracking-[0.2em] uppercase">
              APEX<span className="text-primary">ADMIN</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-6">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 px-3 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-secondary-foreground/70 hover:bg-white/5 hover:text-white text-sm"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="px-3 py-2 text-xs text-white/30">
            Admin User
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-secondary-foreground/70 hover:text-white transition-colors rounded-lg hover:bg-white/5 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Back to Store
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-[calc(100vh-5rem)]">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, orders..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary text-gray-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
              <Bell className="w-5 h-5" />
            </button>
            <Link
              href="/admin/products/new"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        </div>

        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
