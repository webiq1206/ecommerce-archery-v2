import type { Metadata } from "next";
import Link from "next/link";
import { db, ordersTable, orderItemsTable, productsTable, productImagesTable, brandsTable } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { AnimatedCheckmark } from "./AnimatedCheckmark";
import { OrderTracker } from "@/components/analytics/OrderTracker";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: "noindex, nofollow",
};

async function getFeaturedProducts() {
  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      price: productsTable.price,
      compareAtPrice: productsTable.compareAtPrice,
      isFeatured: productsTable.isFeatured,
      isNewArrival: productsTable.isNewArrival,
    })
    .from(productsTable)
    .where(and(eq(productsTable.status, "ACTIVE"), eq(productsTable.isFeatured, true)))
    .orderBy(sql`RANDOM()`)
    .limit(4);

  const productIds = products.map((p) => p.id);
  if (productIds.length === 0) return [];

  const images = await db
    .select()
    .from(productImagesTable)
    .where(sql`${productImagesTable.productId} IN ${productIds}`);

  const brands = await db
    .select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug, productId: productsTable.id })
    .from(brandsTable)
    .innerJoin(productsTable, eq(productsTable.brandId, brandsTable.id))
    .where(sql`${productsTable.id} IN ${productIds}`);

  return products.map((p) => ({
    ...p,
    images: images
      .filter((img) => img.productId === p.id)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    brand: brands.find((b) => b.productId === p.id) ?? null,
  }));
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;

  let order = null;
  let orderItems: any[] = [];

  if (order_id) {
    const [result] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, order_id))
      .limit(1);
    order = result ?? null;

    if (order) {
      orderItems = await db
        .select()
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, order.id));
    }
  }

  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <AnimatedCheckmark />
      {order && (
        <OrderTracker
          orderId={order.id}
          total={Number(order.total)}
          itemCount={orderItems.length}
        />
      )}
      <h1 className="font-display text-4xl text-white mb-4">Order Confirmed!</h1>

      {order ? (
        <>
          <p className="text-white/50 mb-2">
            Thank you for your order. Your order number is:
          </p>
          <p className="text-2xl font-display text-primary mb-6">{order.orderNumber}</p>
          <p className="text-sm text-white/40 mb-8">
            A confirmation email has been sent to {order.customerEmail}.
          </p>

          {orderItems.length > 0 && (
            <div className="bg-card rounded-xl p-6 mb-8 text-left">
              <h3 className="font-display text-sm tracking-wider uppercase text-white/60 mb-4">Order Items</h3>
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white normal-case">{item.name}</p>
                    <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm text-white">${Number(item.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t border-white/10">
                <span className="text-sm font-medium text-white">Total</span>
                <span className="text-sm font-medium text-white">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          )}

          {order.trackingNumber && (
            <Link
              href={order.trackingUrl ?? "#"}
              className="inline-block mb-4 text-primary hover:text-primary/80 text-sm font-medium"
            >
              Track Your Order
            </Link>
          )}
        </>
      ) : (
        <p className="text-white/50 mb-8">
          Your order has been placed successfully.
        </p>
      )}

      <Link
        href="/products"
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 inline-block"
      >
        Continue Shopping
      </Link>

      {featuredProducts.length > 0 && (
        <section className="mt-20 border-t border-white/5 pt-16 text-left">
          <h2 className="font-display text-2xl md:text-3xl font-normal text-white mb-10 text-center">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
