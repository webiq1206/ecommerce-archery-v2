"use client";

import { Download } from "lucide-react";

interface DistributorRow {
  name: string;
  email: string;
  contactName: string;
  phone: string;
  isActive: boolean;
  productCount: number;
}

export function DistributorsCsvExport({ data }: { data: DistributorRow[] }) {
  const exportCsv = () => {
    const rows = [
      ["Name", "Email", "Contact", "Phone", "Status", "Products Assigned"],
      ...data.map((d) => [
        d.name,
        d.email,
        d.contactName,
        d.phone,
        d.isActive ? "Active" : "Inactive",
        String(d.productCount),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `distributors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (data.length === 0) return null;

  return (
    <button
      onClick={exportCsv}
      className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
