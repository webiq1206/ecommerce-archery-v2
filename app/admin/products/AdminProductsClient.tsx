"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useRef } from "react";
import { Plus, Edit2, ChevronUp, ChevronDown, Download, Upload, Trash2, Archive, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  status: string;
  imageUrl: string | null;
  brandName: string | null;
  distributorName: string | null;
  categoryName: string | null;
}

interface Brand { id: string; name: string; slug: string; }
interface Category { id: string; name: string; slug: string; }

export function AdminProductsClient({
  initialProducts,
  total,
  page,
  totalPages,
  brands,
  categories,
  searchParams,
}: {
  initialProducts: Product[];
  total: number;
  page: number;
  totalPages: number;
  brands: Brand[];
  categories: Category[];
  searchParams: { status?: string; category?: string; brand?: string; sort?: string; page?: string };
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    }
    p.delete("page");
    if (updates.page) p.set("page", updates.page);
    const q = p.toString();
    return q ? `/admin/products?${q}` : "/admin/products";
  };

  const sortVal = searchParams.sort ?? "createdAt-desc";
  const [sortCol, sortDir] = sortVal.split("-");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === initialProducts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(initialProducts.map((p) => p.id)));
    }
  };

  const handleStatusToggle = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "DRAFT" : "ACTIVE";
    await fetch(`/api/admin/products/${productId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  };

  const handleBulkAction = async (action: "activate" | "archive" | "delete") => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      setSelected(new Set());
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Name", "SKU", "Price", "Status", "Brand", "Category", "Distributor"];
    const rows = initialProducts.map((p) => [
      p.id, p.name, p.sku, p.price, p.status,
      p.brandName ?? "", p.categoryName ?? "", p.distributorName ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await fetch("/api/admin/products/import", { method: "POST", body: formData });
    router.refresh();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const SortHeader = ({ col, label }: { col: string; label: string }) => {
    const nextDir = sortCol === col && sortDir === "asc" ? "desc" : "asc";
    const isActive = sortCol === col;
    return (
      <th className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">
        <Link href={buildUrl({ sort: `${col}-${nextDir}` })} className="flex items-center gap-1 hover:text-gray-900 transition-colors">
          {label}
          {isActive ? sortDir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" /> : null}
        </Link>
      </th>
    );
  };

  return (
    <div className="bg-white text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          <Link href="/admin/products/new" className="bg-primary text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      <div className="mb-6 p-4 bg-white rounded-2xl border border-gray-200 flex flex-wrap items-center gap-4">
        <select value={searchParams.status ?? ""} onChange={(e) => router.push(buildUrl({ status: e.target.value || undefined }))} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select value={searchParams.category ?? ""} onChange={(e) => router.push(buildUrl({ category: e.target.value || undefined }))} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={searchParams.brand ?? ""} onChange={(e) => router.push(buildUrl({ brand: e.target.value || undefined }))} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
        </select>

        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600">{selected.size} selected</span>
            <button onClick={() => handleBulkAction("activate")} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 disabled:opacity-50">
              <CheckCircle className="w-3.5 h-3.5" /> Activate
            </button>
            <button onClick={() => handleBulkAction("archive")} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-medium hover:bg-yellow-100 disabled:opacity-50">
              <Archive className="w-3.5 h-3.5" /> Archive
            </button>
            <button onClick={() => { if (confirm("Delete selected products?")) handleBulkAction("delete"); }} disabled={bulkLoading} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-900">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 w-10">
                <input type="checkbox" checked={selected.size === initialProducts.length && initialProducts.length > 0} onChange={toggleAll} className="rounded border-gray-300" />
              </th>
              <th className="px-6 py-4 font-medium text-gray-500">Product</th>
              <SortHeader col="sku" label="SKU" />
              <SortHeader col="price" label="Price" />
              <SortHeader col="status" label="Status" />
              <th className="px-6 py-4 font-medium text-gray-500">Brand</th>
              <th className="px-6 py-4 font-medium text-gray-500">Category</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {initialProducts.map((product) => (
              <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${selected.has(product.id) ? "bg-blue-50/30" : ""}`}>
                <td className="px-6 py-4">
                  <input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)} className="rounded border-gray-300" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {product.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-700">{product.sku}</td>
                <td className="px-6 py-4 font-medium text-gray-900">${product.price}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleStatusToggle(product.id, product.status)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      product.status === "ACTIVE"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : product.status === "DRAFT"
                          ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${product.status === "ACTIVE" ? "bg-green-500" : product.status === "DRAFT" ? "bg-gray-400" : "bg-red-500"}`} />
                    {product.status}
                  </button>
                </td>
                <td className="px-6 py-4 text-gray-600">{product.brandName ?? "—"}</td>
                <td className="px-6 py-4 text-gray-600">{product.categoryName ?? "—"}</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/products/${product.id}`} className="inline-flex p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {initialProducts.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}</p>
          <div className="flex gap-2">
            {page > 1 && <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-50">Previous</Link>}
            {page < totalPages && <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-50">Next</Link>}
          </div>
        </div>
      )}
    </div>
  );
}
