"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, ShoppingCart, TrendingUp, RotateCcw, Download } from "lucide-react";
import { RevenueReportChart } from "./RevenueReportChart";

interface RevenueData {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  totalRefunds: number;
  netRevenue: number;
  chartData: { date: string; revenue: number }[];
}

export function RevenueReportClient({
  data,
  initialStart,
  initialEnd,
}: {
  data: RevenueData;
  initialStart: string;
  initialEnd: string;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  const applyFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    const qs = params.toString();
    router.push(`/admin/reports/revenue${qs ? `?${qs}` : ""}`);
  };

  const exportCsv = () => {
    const rows = [
      ["Date", "Revenue"],
      ...data.chartData.map((d) => [d.date, d.revenue.toFixed(2)]),
      [],
      ["Summary"],
      ["Total Revenue", data.totalRevenue.toFixed(2)],
      ["Order Count", String(data.orderCount)],
      ["Avg Order Value", data.avgOrderValue.toFixed(2)],
      ["Total Refunds", data.totalRefunds.toFixed(2)],
      ["Net Revenue", data.netRevenue.toFixed(2)],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-display font-normal text-gray-900">Revenue Report</h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
          />
          <button
            onClick={applyFilter}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            Apply
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-normal font-display text-gray-900">${data.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Order Count</p>
              <h3 className="text-2xl font-normal font-display text-gray-900">{data.orderCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Avg Order Value</p>
              <h3 className="text-2xl font-normal font-display text-gray-900">${data.avgOrderValue.toFixed(2)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Refunds</p>
              <h3 className="text-2xl font-normal font-display text-gray-900">${data.totalRefunds.toFixed(2)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-red-600">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          Revenue Over Time
          {!initialStart && !initialEnd && " (Last 30 Days)"}
        </h3>
        <RevenueReportChart data={data.chartData} />
      </div>
    </>
  );
}
