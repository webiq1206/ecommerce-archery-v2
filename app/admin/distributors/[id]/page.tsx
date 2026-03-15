import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, distributorsTable, fulfillmentLogsTable, productsTable } from "@/lib/db";
import { eq, sql, and } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { DistributorEditForm } from "./DistributorEditForm";

export const metadata: Metadata = { title: "Edit Distributor" };

async function getDistributorData(id: string) {
  const [dist] = await db.select().from(distributorsTable).where(eq(distributorsTable.id, id));
  if (!dist) return null;

  const [ordersFulfilled] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fulfillmentLogsTable)
    .where(
      and(
        eq(fulfillmentLogsTable.distributorId, id),
        sql`${fulfillmentLogsTable.status} IN ('EMAIL_SENT', 'CONFIRMED', 'SHIPPED', 'DELIVERED')`
      )
    );

  const [assignedProducts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(eq(productsTable.distributorId, id));

  return {
    ...dist,
    ordersFulfilled: ordersFulfilled?.count ?? 0,
    assignedProductsCount: assignedProducts?.count ?? 0,
  };
}

export default async function DistributorEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDistributorData(id);
  if (!data) notFound();

  return (
    <>
      <Link
        href="/admin/distributors"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Distributors
      </Link>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">
        Edit Distributor: {data.name}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Details</h2>
            <DistributorEditForm distributor={data} />
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Orders fulfilled</p>
                <p className="text-xl font-medium text-gray-900">{data.ordersFulfilled}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned products</p>
                <p className="text-xl font-medium text-gray-900">{data.assignedProductsCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
