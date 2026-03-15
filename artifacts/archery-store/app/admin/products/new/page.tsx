"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

const TABS = ["General", "Media", "Pricing", "Variants", "Specifications", "FAQs", "SEO"] as const;

type Spec = { key: string; value: string };
type Faq = { question: string; answer: string };
type VariantOption = { name: string; values: string[] };

export default function NewProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED">("DRAFT");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [cost, setCost] = useState("");

  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const slugFromName = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const handleNameChange = (v: string) => {
    setName(v);
    if (!slug || slug === slugFromName(name)) setSlug(slugFromName(v));
  };

  const variantsMatrix = useMemo(() => {
    if (variantOptions.length === 0) return [];
    const values = variantOptions.map((o) => o.values.filter(Boolean));
    if (values.some((v) => v.length === 0)) return [];
    const combine = (arr: string[][]): string[][] =>
      arr.length === 1 ? arr[0].map((v) => [v]) : combine(arr.slice(1)).flatMap((rest) => arr[0].map((v) => [v, ...rest]));
    return combine(values);
  }, [variantOptions]);

  const addSpec = () => setSpecs((s) => [...s, { key: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, j) => j !== i));
  const updateSpec = (i: number, f: "key" | "value", v: string) => setSpecs((s) => s.map((x, j) => (j === i ? { ...x, [f]: v } : x)));

  const addFaq = () => setFaqs((f) => [...f, { question: "", answer: "" }]);
  const removeFaq = (i: number) => setFaqs((f) => f.filter((_, j) => j !== i));
  const updateFaq = (i: number, f: "question" | "answer", v: string) => setFaqs((x) => x.map((a, j) => (j === i ? { ...a, [f]: v } : a)));

  const addVariantOption = () => setVariantOptions((o) => [...o, { name: "", values: [] }]);
  const removeVariantOption = (i: number) => setVariantOptions((o) => o.filter((_, j) => j !== i));
  const updateVariantOption = (i: number, name: string, valuesStr: string) =>
    setVariantOptions((o) => o.map((x, j) => (j === i ? { name, values: valuesStr.split(",").map((v) => v.trim()).filter(Boolean) } : x)));

  const addImageUrl = () => setImageUrls((u) => [...u, ""]);
  const removeImageUrl = (i: number) => setImageUrls((u) => u.filter((_, j) => j !== i));
  const updateImageUrl = (i: number, v: string) => setImageUrls((u) => u.map((x, j) => (j === i ? v : x)));

  const sku = useMemo(() => slug.replace(/-/g, "").toUpperCase().slice(0, 12) || "SKU", [slug]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          sku,
          status,
          shortDescription: shortDescription.slice(0, 150),
          description,
          price: price || "0",
          compareAtPrice: compareAtPrice || undefined,
          cost: cost || undefined,
          brandId: brandId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");
      router.push(`/admin/products/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(Array.isArray(d) ? d : d?.brands ?? [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>

      <h1 className="text-2xl font-display font-normal text-gray-900">New Product</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === i ? "border-primary text-primary" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {activeTab === 0 && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                placeholder="Product name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Slug (auto-generated)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm"
                placeholder="product-slug"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Brand</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "DRAFT" | "ACTIVE" | "ARCHIVED")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Short Description ({shortDescription.length}/150)</label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value.slice(0, 150))}
                maxLength={150}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={url}
                  onChange={(e) => updateImageUrl(i, e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <button type="button" onClick={() => removeImageUrl(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addImageUrl} className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plus className="w-4 h-4" /> Add Image
            </button>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Compare at price</label>
              <input
                type="number"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Cost</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
              />
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            {variantOptions.map((opt, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  placeholder="Option name (e.g. Size)"
                  value={opt.name}
                  onChange={(e) => updateVariantOption(i, e.target.value, opt.values.join(", "))}
                  className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <input
                  placeholder="Values (comma-separated)"
                  value={opt.values.join(", ")}
                  onChange={(e) => updateVariantOption(i, opt.name, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <button type="button" onClick={() => removeVariantOption(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addVariantOption} className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plus className="w-4 h-4" /> Add Option
            </button>
            {variantsMatrix.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Variant matrix ({variantsMatrix.length} combinations)</p>
                <div className="flex flex-wrap gap-2">
                  {variantsMatrix.map((combo, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                      {combo.join(" / ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-4">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Key"
                  value={s.key}
                  onChange={(e) => updateSpec(i, "key", e.target.value)}
                  className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <input
                  placeholder="Value"
                  value={s.value}
                  onChange={(e) => updateSpec(i, "value", e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <button type="button" onClick={() => removeSpec(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addSpec} className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plus className="w-4 h-4" /> Add Spec
            </button>
          </div>
        )}

        {activeTab === 5 && (
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
                <input
                  placeholder="Question"
                  value={f.question}
                  onChange={(e) => updateFaq(i, "question", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <textarea
                  placeholder="Answer"
                  value={f.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                />
                <button type="button" onClick={() => removeFaq(i)} className="text-sm text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addFaq} className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </div>
        )}

        {activeTab === 6 && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">SEO Title ({seoTitle.length}/60)</label>
              <input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value.slice(0, 60))}
                maxLength={60}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                placeholder="Optimized title for search"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Meta Description ({metaDescription.length}/160)</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))}
                maxLength={160}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900"
                placeholder="Brief description for search results"
              />
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Google snippet preview</p>
              <p className="text-blue-600 font-medium truncate">{seoTitle || "SEO Title"}</p>
              <p className="text-sm text-gray-600 truncate">{metaDescription || "Meta description"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
