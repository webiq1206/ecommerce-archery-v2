"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export function RevenueReportChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed rounded-xl">
        No revenue data for the last 30 days
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueReportGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e07830" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e07830" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#999" }}
          tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })}
        />
        <YAxis tick={{ fontSize: 11, fill: "#999" }} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
          labelFormatter={(label) => new Date(label).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
        />
        <Area type="monotone" dataKey="revenue" stroke="#e07830" strokeWidth={2} fill="url(#revenueReportGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
