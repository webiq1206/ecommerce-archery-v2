import type { Metadata } from "next";
import Link from "next/link";
import { db, productsTable, orderItemsTable } from "@workspace/db";
import { sql, eq, desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Products Report" };

async function getProductsReport() {
  const [bestByQuantity, bestByRevenue, allProductIds, soldProductIds] = await Promise.all([
    db
      .select({
        productId: orderItemsTable.productId,
        name: orderItemsTable.name,
        quantity: sql<number>`SUM(${orderItemsTable.quantity})::int`,
      })
      .from(orderItemsTable)
      .groupBy(orderItemsTable.productId, orderItemsTable.name)
      .orderBy(desc(sql`SUM(${orderItemsTable.quantity})`))
      .limit(20),
    db
      .select({
        productId: orderItemsTable.productId,
        name: orderItemsTable.name,
        revenue: sql<string>`SUM(${orderItemsTable.price}::numeric * ${orderItemsTable.quantity})::text`,
      })
      .from(orderItemsTable)
      .groupBy(orderItemsTable.productId, orderItemsTable.name)
      .orderBy(desc(sql`SUM(${orderItemsTable.price}::numeric * ${orderItemsTable.quantity})`))
      .limit(20),
    db.select({ id: productsTable.id }).from(productsTable),
    db.selectDistinct({ productId: orderItemsTable.productId }).from(orderItemsTable),
  ]);

  const soldIds = new Set(soldProductIds.map((s) => s.productId));
  const zeroSalesProducts = await db
    .select({ id: productsTable.id, name: productsTable.name, slug: productsTable.slug })
    .from(productsTable)
    .where(sql`${productsTable.id} NOT IN (SELECT product_id FROM order_items)`);

  return {
    bestByQuantity: bestByQuantity.map((r) => ({ ...r, quantity: Number(r.quantity) })),
    bestByRevenue: bestByRevenue.map((r) => ({ ...r, revenue: Number(r.revenue) })),
    zeroSalesProducts,
  };
}

export default async function ProductsReportPage() {
  const data = await getProductsReport();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Products Report</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Best Sellers by Quantity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Product</th>
                  <th className="text-right py-3 px-2">Qty Sold</th>
                </tr>
              </thead>
              <tbody>
                {data.bestByQuantity.map((row) => (
                  <tr key={row.productId} className="border-b border-gray-100">
                    <td className="py-3 px-2">{row.name}</td>
                    <td className="py-3 px-2 text-right font-medium">{row.quantity}</td>
                  </tr>
                ))}
                {data.bestByQuantity.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">
                      No sales data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Best Sellers by Revenue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Product</th>
                  <th className="text-right py-3 px-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.bestByRevenue.map((row) => (
                  <tr key={row.productId} className="border-b border-gray-100">
                    <td className="py-3 px-2">{row.name}</td>
                    <td className="py-3 px-2 text-right font-medium">${row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {data.bestByRevenue.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">
                      No sales data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Products with Zero Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2">Product</th>
                <th className="text-right py-3 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.zeroSalesProducts.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-3 px-2">{p.name}</td>
                  <td className="py-3 px-2 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-primary hover:text-primary/80 font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {data.zeroSalesProducts.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-gray-500">
                    All products have at least one sale
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
