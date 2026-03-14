import { AdminLayout } from "./AdminLayout";
import { useListCustomers } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function AdminCustomers() {
  const { data, isLoading } = useListCustomers({ limit: 50 });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-bold">Customers</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading customers...</div>
      ) : !data?.customers?.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No customers yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Orders</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total Spent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-medium">{customer.name ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">{customer.email}</td>
                  <td className="px-6 py-4 text-center">{customer.orderCount}</td>
                  <td className="px-6 py-4 font-medium">${customer.totalSpent}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {format(new Date(customer.createdAt), "MMM d, yyyy")}
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
