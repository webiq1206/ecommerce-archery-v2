import Link from "next/link";
import { ShoppingBag, Heart, MapPin, Settings, ChevronRight, Package, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { db, ordersTable } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { WishlistCount } from "./WishlistCount";

const sections = [
  { name: "Order History", href: "/account/orders", icon: ShoppingBag, description: "View and track your orders" },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart, description: "Your saved products" },
  { name: "Addresses", href: "/account/addresses", icon: MapPin, description: "Manage shipping addresses" },
  { name: "Account Settings", href: "/account/settings", icon: Settings, description: "Update your profile" },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  PROCESSING: "bg-blue-500/20 text-blue-400",
  SHIPPED: "bg-purple-500/20 text-purple-400",
  DELIVERED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  REFUNDED: "bg-orange-500/20 text-orange-400",
};

export default async function AccountDashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? "Archer";
  const userId = session?.user?.id;

  let recentOrder: {
    id: string;
    orderNumber: string;
    status: string;
    total: string;
    createdAt: Date;
  } | null = null;

  if (userId) {
    const [order] = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        status: ordersTable.status,
        total: ordersTable.total,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .where(eq(ordersTable.userId, userId))
      .orderBy(desc(ordersTable.createdAt))
      .limit(1);

    recentOrder = order ?? null;
  }

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider mb-2">My Account</h1>
      <p className="text-white/60 mb-8">Welcome back, {userName}!</p>

      {/* Recent Order & Wishlist summary */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl bg-card border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm uppercase tracking-wider text-white/80">Recent Order</h2>
          </div>
          {recentOrder ? (
            <Link href={`/account/orders/${recentOrder.id}`} className="group block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white group-hover:text-primary transition-colors">
                  {recentOrder.orderNumber}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[recentOrder.status] ?? "bg-white/10 text-white/60"}`}
                >
                  {recentOrder.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/50">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(recentOrder.createdAt).toLocaleDateString()}
                </span>
                <span className="text-white/70 font-medium">${Number(recentOrder.total).toFixed(2)}</span>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-white/40">No orders yet.</p>
          )}
        </div>

        <div className="rounded-xl bg-card border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm uppercase tracking-wider text-white/80">Wishlist</h2>
          </div>
          <WishlistCount />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.name}
            href={section.href}
            className="group flex items-center gap-4 p-5 rounded-xl bg-card border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 text-primary">
              <section.icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white group-hover:text-primary transition-colors">{section.name}</h3>
              <p className="text-sm text-white/50">{section.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-primary shrink-0 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
