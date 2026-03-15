import type { Metadata } from "next";
import Link from "next/link";
import { db, distributorsTable, productsTable } from "@/lib/db";
import { sql } from "drizzle-orm";
import { DistributorsCsvExport } from "./DistributorsCsvExport";

export const metadata: Metadata = { title: "Admin Distributors" };

async function getDistributors() {
  const distributors = await db.select().from(distributorsTable);
  const productCounts = await db
    .select({
      distributorId: productsTable.distributorId,
      count: sql<number>`count(*)::int`,
    })
    .from(productsTable)
    .where(sql`${productsTable.distributorId} IS NOT NULL`)
    .groupBy(productsTable.distributorId);

  const countMap = new Map(productCounts.map((pc) => [pc.distributorId, pc.count]));

  return distributors.map((d) => ({
    ...d,
    productCount: countMap.get(d.id) ?? 0,
  }));
}

export default async function AdminDistributorsPage() {
  const distributors = await getDistributors();

  const csvData = distributors.map((d) => ({
    name: d.name,
    email: d.email,
    contactName: d.contactName ?? "",
    phone: d.phone ?? "",
    isActive: d.isActive,
    productCount: d.productCount,
  }));

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-normal">Distributors</h1>
        <DistributorsCsvExport data={csvData} />
      </div>
      {distributors.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No distributors configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {distributors.map((dist) => (
            <Link key={dist.id} href={`/admin/distributors/${dist.id}`} className="bg-card border border-border rounded-2xl p-6 block hover:border-primary/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-normal">{dist.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${dist.isActive ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`}>
                  {dist.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {dist.contactName && <p className="text-sm text-muted-foreground mb-1">Contact: {dist.contactName}</p>}
              <p className="text-sm text-muted-foreground mb-1">Email: {dist.email}</p>
              {dist.phone && <p className="text-sm text-muted-foreground mb-1">Phone: {dist.phone}</p>}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium">{dist.productCount} products assigned</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
