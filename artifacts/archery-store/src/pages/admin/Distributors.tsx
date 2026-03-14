import { AdminLayout } from "./AdminLayout";
import { useListDistributors } from "@workspace/api-client-react";

export default function AdminDistributors() {
  const { data, isLoading } = useListDistributors();

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-bold">Distributors</h1>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading distributors...</div>
      ) : !data?.length ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No distributors configured</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.map((dist) => (
            <div key={dist.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">{dist.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${dist.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {dist.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {dist.contactName && <p className="text-sm text-muted-foreground mb-1">Contact: {dist.contactName}</p>}
              <p className="text-sm text-muted-foreground mb-1">Email: {dist.email}</p>
              {dist.phone && <p className="text-sm text-muted-foreground mb-1">Phone: {dist.phone}</p>}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium">{dist.productCount ?? 0} products assigned</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
