import AdminLayout from "./AdminLayout";
import { useGetRevenueReport, useGetProductsReport } from "@workspace/api-client-react";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";

export default function Dashboard() {
  const { data: revenueData } = useGetRevenueReport();
  const { data: productsData } = useGetProductsReport();

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold font-display">${revenueData?.totalRevenue || "0.00"}</h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-sm text-green-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-4 h-4" /> +12.5% from last month
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold font-display">{revenueData?.totalOrders || "0"}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg Order Value</p>
              <h3 className="text-2xl font-bold font-display">${revenueData?.averageOrderValue || "0.00"}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold font-display">{productsData?.lowStockProducts?.length || "0"}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-border p-6 min-h-[400px]">
          <h3 className="font-bold text-lg mb-6">Revenue Over Time</h3>
          <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl">
            Chart integration placeholder
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <h3 className="font-bold text-lg mb-6">Top Products</h3>
          <div className="space-y-4">
            {productsData?.topProducts?.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.totalSold} sold</p>
                </div>
                <span className="font-bold">${item.revenue}</span>
              </div>
            ))}
            {!productsData?.topProducts?.length && (
              <p className="text-muted-foreground text-sm">No data available.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
