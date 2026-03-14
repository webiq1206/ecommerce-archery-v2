"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  status: string;
  imageUrl: string | null;
  brandName: string | null;
}

export function AdminProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", slug: "", sku: "", price: "", shortDescription: "" });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setSaving(false);
    if (res.ok) {
      setShowAdd(false);
      setFormData({ name: "", slug: "", sku: "", price: "", shortDescription: "" });
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-display font-normal">Products</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-border mb-8">
          <h3 className="font-normal text-lg mb-6">Add New Product</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, "-") })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input required className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input required type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Short Description</label>
              <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} />
            </div>
            <div className="col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50">Cancel</button>
              <button disabled={saving} type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 shadow-sm disabled:opacity-50">
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-medium text-muted-foreground">Product</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">SKU</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Price</th>
              <th className="px-6 py-4 font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-4 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initialProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-md overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {product.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{product.name}</p>
                      {product.brandName && <p className="text-xs text-muted-foreground">{product.brandName}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{product.sku}</td>
                <td className="px-6 py-4 font-medium">${product.price}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${product.status === "ACTIVE" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors bg-white border rounded-md shadow-sm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-destructive transition-colors bg-white border rounded-md shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {initialProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No products found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
