import type { Metadata } from "next";
import { db, discountsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Discounts" };

async function getDiscounts() {
  return db.select().from(discountsTable).orderBy(desc(discountsTable.createdAt));
}

export default async function AdminDiscountsPage() {
  const discounts = await getDiscounts();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Discounts</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {discounts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No discounts configured</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Code</th>
                  <th className="text-left py-3 px-4 font-medium">Type</th>
                  <th className="text-left py-3 px-4 font-medium">Value</th>
                  <th className="text-left py-3 px-4 font-medium">Usage</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-mono">{d.code}</td>
                    <td className="py-3 px-4">{d.type}</td>
                    <td className="py-3 px-4">
                      {d.type === "PERCENTAGE" ? `${Number(d.value)}%` : d.type === "FREE_SHIPPING" ? "Free shipping" : `$${Number(d.value).toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4">{d.usedCount}{d.maxUses != null ? ` / ${d.maxUses}` : ""}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
