import { AdminLayout } from "./AdminLayout";
import { useListFulfillmentLogs } from "@workspace/api-client-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  EMAIL_SENT: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function AdminFulfillment() {
  const { data, isLoading } = useListFulfillmentLogs({ limit: 50 });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-bold">Fulfillment Logs</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading fulfillment logs...</div>
      ) : !data?.logs?.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No fulfillment logs yet</p>
          <p className="text-sm text-muted-foreground mt-2">Fulfillment logs appear here when orders are processed</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Order</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Distributor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email Sent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-mono text-sm">{log.orderId.slice(0, 8)}...</td>
                  <td className="px-6 py-4">{log.distributorId.slice(0, 8)}...</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[log.status] ?? "bg-gray-100"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {log.emailSentAt ? format(new Date(log.emailSentAt), "MMM d, HH:mm") : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
