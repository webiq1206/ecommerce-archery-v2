"use client";

import Link from "next/link";
import { Download } from "lucide-react";

interface DistributorReport {
  id: string;
  name: string;
  isActive: boolean;
  orderCount: number;
  itemCount: number;
  totalGmv: number;
  pendingOrders: number;
}

export function DistributorReportClient({ reports }: { reports: DistributorReport[] }) {
  const exportCsv = () => {
    const rows = [
      ["Distributor", "Orders", "Items", "Total GMV", "Pending", "Status"],
      ...reports.map((r) => [
        r.name,
        String(r.orderCount),
        String(r.itemCount),
        r.totalGmv.toFixed(2),
        String(r.pendingOrders),
        r.isActive ? "Active" : "Inactive",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `distributor-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-normal text-gray-900">Distributor Reports</h1>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Per-distributor performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-900">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium">Distributor</th>
                <th className="text-right py-3 px-4 font-medium">Orders</th>
                <th className="text-right py-3 px-4 font-medium">Items</th>
                <th className="text-right py-3 px-4 font-medium">Total GMV</th>
                <th className="text-right py-3 px-4 font-medium">Pending</th>
                <th className="text-center py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <Link href={`/admin/distributors/${r.id}`} className="text-primary hover:text-primary/80">
                      {r.name}
                    </Link>
                  </td>
                  <td className="text-right py-3 px-4">{r.orderCount}</td>
                  <td className="text-right py-3 px-4">{r.itemCount}</td>
                  <td className="text-right py-3 px-4">${r.totalGmv.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">{r.pendingOrders}</td>
                  <td className="text-center py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reports.length === 0 && (
          <p className="text-center text-gray-500 py-8">No distributor data yet</p>
        )}
      </div>
    </>
  );
}
