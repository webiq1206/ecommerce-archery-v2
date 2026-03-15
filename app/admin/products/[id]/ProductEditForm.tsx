"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, GripVertical, Sparkles, Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploader } from "@/components/admin/ImageUploader";

const TABS = ["General", "Media", "Pricing", "Variants", "Categorization", "Fulfillment", "Specifications", "FAQs", "SEO", "Related"] as const;

type Spec = { id?: string; label: string; value: string };
type Faq = { id?: string; question: string; answer: string };
type Image = { id: string; url: string; altText: string };
type VariantOption = { name: string; values: string };
type Variant = { id: string; options: Record<string, string>; sku: string; priceOverride: string; inventory: number; active: boolean };
type CategoryNode = { id: string; name: string; slug: string; parentId: string | null; children: CategoryNode[] };

type ProductData = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: string;
  shortDescription: string;
  description: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  brandId: string;
  distributorId: string;
  seoTitle: string;
  seoDesc: string;
  gtin: string;
  mpn: string;
  images: Image[];
  specs: { id: string; label: string; value: string }[];
  faqs: { id: string; question: string; answer: string }[];
  categoryIds: string[];
  relatedProductIds: string[];
  variants: { id: string; sku: string; name: string; price: string; options: Record<string, string> }[];
};

export function ProductEditForm({ product }: { product: ProductData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [brandId, setBrandId] = useState(product.brandId);
  const [distributorId, setDistributorId] = useState(product.distributorId);
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ARCHIVED">(product.status as any);
  const [shortDescription, setShortDescription] = useState(product.shortDescription);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(product.price);
  const [compareAtPrice, setCompareAtPrice] = useState(product.compareAtPrice);
  const [cost, setCost] = useState(product.cost);
  const [specs, setSpecs] = useState<Spec[]>(product.specs.map((s) => ({ id: s.id, label: s.label, value: s.value })));
  const [faqs, setFaqs] = useState<Faq[]>(product.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })));
  const [imageUrls, setImageUrls] = useState<string[]>(
    product.images.length > 0 ? product.images.map((i) => i.url) : []
  );
  const [seoTitle, setSeoTitle] = useState(product.seoTitle);
  const [metaDescription, setMetaDescription] = useState(product.seoDesc);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(product.categoryIds ?? []);
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>(product.relatedProductIds ?? []);
  const [shippingWeight, setShippingWeight] = useState("");
  const [shippingDimensions, setShippingDimensions] = useState({ length: "", width: "", height: "" });

  // Variants
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [variants, setVariants] = useState<Variant[]>(() =>
    (product.variants ?? []).map((v) => ({
      id: v.id,
      options: v.options ?? {},
      sku: v.sku,
      priceOverride: v.price || "",
      inventory: 0,
      active: true,
    }))
  );
  const [bulkPrice, setBulkPrice] = useState("");

  // SEO extras
  const [gtin, setGtin] = useState(product.gtin ?? "");
  const [mpn, setMpn] = useState(product.mpn ?? "");

  // AI suggestions
  const [aiLoading, setAiLoading] = useState(false);

  // Drag state for specs/faqs
  const [dragSpecIdx, setDragSpecIdx] = useState<number | null>(null);
  const [dragFaqIdx, setDragFaqIdx] = useState<number | null>(null);

  // Media drag state
  const [dragImageIdx, setDragImageIdx] = useState<number | null>(null);

  const slugFromName = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const handleNameChange = (v: string) => {
    setName(v);
    if (slug === slugFromName(name)) setSlug(slugFromName(v));
  };

  const addSpec = () => setSpecs((s) => [...s, { label: "", value: "" }]);
  const removeSpec = (i: number) => setSpecs((s) => s.filter((_, j) => j !== i));
  const updateSpec = (i: number, f: "label" | "value", v: string) => setSpecs((s) => s.map((x, j) => (j === i ? { ...x, [f]: v } : x)));

  const addFaq = () => setFaqs((f) => [...f, { question: "", answer: "" }]);
  const removeFaq = (i: number) => setFaqs((f) => f.filter((_, j) => j !== i));
  const updateFaq = (i: number, f: "question" | "answer", v: string) => setFaqs((x) => x.map((a, j) => (j === i ? { ...a, [f]: v } : a)));

  // Variant helpers
  const addVariantOption = () => setVariantOptions((o) => [...o, { name: "", values: "" }]);
  const removeVariantOption = (i: number) => setVariantOptions((o) => o.filter((_, j) => j !== i));
  const updateVariantOption = (i: number, field: "name" | "values", v: string) =>
    setVariantOptions((o) => o.map((x, j) => (j === i ? { ...x, [field]: v } : x)));

  const generateVariants = () => {
    const parsed = variantOptions
      .filter((o) => o.name.trim() && o.values.trim())
      .map((o) => ({ name: o.name.trim(), vals: o.values.split(",").map((v) => v.trim()).filter(Boolean) }));
    if (parsed.length === 0) return;

    const combos: Record<string, string>[][] = [[]];
    for (const opt of parsed) {
      const next: Record<string, string>[][] = [];
      for (const combo of combos) {
        for (const val of opt.vals) {
          next.push([...combo, { [opt.name]: val }]);
        }
      }
      combos.length = 0;
      combos.push(...next);
    }

    setVariants(
      combos.map((combo, i) => {
        const options = Object.assign({}, ...combo);
        const skuSuffix = Object.values(options).join("-").toUpperCase().replace(/[^A-Z0-9]/g, "-");
        return {
          id: crypto.randomUUID(),
          options,
          sku: `${product.sku || "SKU"}-${skuSuffix}`,
          priceOverride: price || "0",
          inventory: 0,
          active: true,
        };
      })
    );
  };

  const updateVariant = (id: string, field: keyof Variant, value: any) =>
    setVariants((v) => v.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    setVariants((v) => v.map((x) => ({ ...x, priceOverride: bulkPrice })));
  };

  // Drag reorder helpers
  const reorder = <T,>(list: T[], from: number, to: number): T[] => {
    const result = [...list];
    const [moved] = result.splice(from, 1);
    result.splice(to, 0, moved);
    return result;
  };

  const handleSpecDrop = (targetIdx: number) => {
    if (dragSpecIdx !== null && dragSpecIdx !== targetIdx) {
      setSpecs((s) => reorder(s, dragSpecIdx, targetIdx));
    }
    setDragSpecIdx(null);
  };

  const handleFaqDrop = (targetIdx: number) => {
    if (dragFaqIdx !== null && dragFaqIdx !== targetIdx) {
      setFaqs((f) => reorder(f, dragFaqIdx, targetIdx));
    }
    setDragFaqIdx(null);
  };

  const handleImageDrop = (targetIdx: number) => {
    if (dragImageIdx !== null && dragImageIdx !== targetIdx) {
      setImageUrls((imgs) => reorder(imgs, dragImageIdx, targetIdx));
    }
    setDragImageIdx(null);
  };

  // AI recommendations
  const suggestRelated = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          categoryId: primaryCategory || undefined,
          tags: [],
        }),
      });
      const data = await res.json();
      if (data.recommendations?.length) {
        const ids = data.recommendations.map((r: { id: string }) => r.id);
        setRelatedProductIds((prev) => {
          const combined = [...prev.filter(Boolean), ...ids];
          return [...new Set(combined)];
        });
      }
    } catch {
      // silently fail
    } finally {
      setAiLoading(false);
    }
  };

  // Build category tree
  const buildCategoryTree = (cats: { id: string; name: string; slug: string; parentId?: string | null }[]): CategoryNode[] => {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];
    for (const c of cats) {
      map.set(c.id, { ...c, parentId: c.parentId ?? null, children: [] });
    }
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, status,
          shortDescription: shortDescription.slice(0, 150),
          description, price: price || "0",
          compareAtPrice: compareAtPrice || undefined,
          cost: cost || undefined,
          brandId: brandId || undefined,
          distributorId: distributorId || undefined,
          seoTitle, seoDesc: metaDescription,
          gtin: gtin || undefined,
          mpn: mpn || undefined,
          images: imageUrls.filter(Boolean).map((url, i) => ({ url, sortOrder: i })),
          specs: specs.filter((s) => s.label && s.value).map((s, i) => ({ label: s.label, value: s.value, sortOrder: i })),
          faqs: faqs.filter((f) => f.question && f.answer).map((f, i) => ({ question: f.question, answer: f.answer, sortOrder: i })),
          categoryIds: selectedCategories,
          primaryCategoryId: primaryCategory || undefined,
          variants: variants.map((v, i) => ({
            sku: v.sku,
            name: Object.values(v.options).join(" / "),
            price: v.priceOverride || undefined,
            inventory: v.inventory,
            isAvailable: v.active,
            options: v.options,
            sortOrder: i,
          })),
          relatedProductIds: relatedProductIds.filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [distributors, setDistributors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/brands").then((r) => r.json()).then((d) => setBrands(Array.isArray(d) ? d : d?.brands ?? [])).catch(() => {});
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(Array.isArray(d) ? d : d?.categories ?? [])).catch(() => {});
    fetch("/api/distributors").then((r) => r.json()).then((d) => setDistributors(Array.isArray(d) ? d : d?.distributors ?? [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 bg-white text-gray-900">
      <div className="flex items-center justify-between">
        <Link href="/admin/products" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <button onClick={handleSave} disabled={saving} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>

      <h1 className="text-2xl font-display font-normal text-gray-900">Edit Product</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">{error}</div>}

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
        {/* General */}
        {activeTab === 0 && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
              <input value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Slug</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Brand</label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                <option value="">Select brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Short Description ({shortDescription.length}/150)</label>
              <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value.slice(0, 150))} maxLength={150} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
              <RichTextEditor content={description} onChange={setDescription} />
            </div>
          </div>
        )}

        {/* Media */}
        {activeTab === 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Product Images (drag to reorder)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
              {imageUrls.filter(Boolean).map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  draggable
                  onDragStart={() => setDragImageIdx(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleImageDrop(i)}
                  className={`relative group aspect-square rounded-lg overflow-hidden border bg-gray-50 cursor-grab active:cursor-grabbing ${
                    dragImageIdx === i ? "border-primary ring-2 ring-primary/20 opacity-50" : "border-gray-200"
                  }`}
                >
                  <div className="absolute top-2 left-2 z-10 p-1 bg-black/40 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3" />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls((imgs) => imgs.filter((_, j) => j !== i))}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">#{i + 1}</span>
                </div>
              ))}
            </div>
            <ImageUploader images={imageUrls} onChange={setImageUrls} />
          </div>
        )}

        {/* Pricing */}
        {activeTab === 2 && (
          <div className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Price</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Compare at price</label>
              <input type="text" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Cost</label>
              <input type="text" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
            </div>
          </div>
        )}

        {/* Variants */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Option Types</h3>
              {variantOptions.map((opt, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    placeholder="Option name (e.g. Draw Weight)"
                    value={opt.name}
                    onChange={(e) => updateVariantOption(i, "name", e.target.value)}
                    className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm"
                  />
                  <input
                    placeholder="Values, comma-separated (e.g. 30lb, 40lb, 50lb)"
                    value={opt.values}
                    onChange={(e) => updateVariantOption(i, "values", e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm"
                  />
                  <button type="button" onClick={() => removeVariantOption(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={addVariantOption} className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Plus className="w-4 h-4" /> Add Option
                </button>
                {variantOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={generateVariants}
                    className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    Generate Variants
                  </button>
                )}
              </div>
            </div>

            {variants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Variant Matrix ({variants.length} variants)</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                      placeholder="Bulk price"
                      className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={applyBulkPrice}
                      className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Apply to All
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {Object.keys(variants[0].options).map((key) => (
                          <th key={key} className="text-left px-3 py-2 font-medium text-gray-700">{key}</th>
                        ))}
                        <th className="text-left px-3 py-2 font-medium text-gray-700">SKU</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Price</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-700">Inventory</th>
                        <th className="text-center px-3 py-2 font-medium text-gray-700">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                          {Object.values(v.options).map((val, oi) => (
                            <td key={oi} className="px-3 py-2 text-gray-700">{val}</td>
                          ))}
                          <td className="px-3 py-1.5">
                            <input
                              value={v.sku}
                              onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono text-gray-900"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              value={v.priceOverride}
                              onChange={(e) => updateVariant(v.id, "priceOverride", e.target.value)}
                              className="w-24 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              value={v.inventory}
                              onChange={(e) => updateVariant(v.id, "inventory", parseInt(e.target.value) || 0)}
                              className="w-20 border border-gray-200 rounded px-2 py-1 text-xs text-gray-900"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={v.active}
                              onChange={(e) => updateVariant(v.id, "active", e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Categorization */}
        {activeTab === 4 && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Categories</label>
              <p className="text-xs text-gray-500 mb-2">Check categories to assign. Use the radio button to set the primary category.</p>
              <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {(() => {
                  const tree = buildCategoryTree(categories as any);
                  const renderNode = (node: CategoryNode, depth: number): React.ReactNode => (
                    <div key={node.id}>
                      <label
                        className="flex items-center gap-2 text-sm text-gray-700 py-1"
                        style={{ paddingLeft: `${depth * 20}px` }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(node.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories((p) => [...p, node.id]);
                            } else {
                              setSelectedCategories((p) => p.filter((id) => id !== node.id));
                              if (primaryCategory === node.id) setPrimaryCategory("");
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className={depth === 0 ? "font-medium" : ""}>{node.name}</span>
                        {selectedCategories.includes(node.id) && (
                          <input
                            type="radio"
                            name="primaryCategory"
                            checked={primaryCategory === node.id}
                            onChange={() => setPrimaryCategory(node.id)}
                            className="ml-auto border-gray-300"
                            title="Set as primary"
                          />
                        )}
                      </label>
                      {node.children.map((child) => renderNode(child, depth + 1))}
                    </div>
                  );
                  return tree.map((node) => renderNode(node, 0));
                })()}
              </div>
            </div>
            {primaryCategory && (
              <p className="text-xs text-gray-500">
                Primary: <span className="font-medium text-gray-700">{categories.find((c) => c.id === primaryCategory)?.name}</span>
              </p>
            )}
          </div>
        )}

        {/* Fulfillment */}
        {activeTab === 5 && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Distributor</label>
              <select value={distributorId} onChange={(e) => setDistributorId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900">
                <option value="">Select distributor</option>
                {distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Shipping Weight (lbs)</label>
              <input type="text" value={shippingWeight} onChange={(e) => setShippingWeight(e.target.value)} placeholder="e.g. 4.5" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Shipping Dimensions (in)</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Length</label>
                  <input type="text" value={shippingDimensions.length} onChange={(e) => setShippingDimensions((d) => ({ ...d, length: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Width</label>
                  <input type="text" value={shippingDimensions.width} onChange={(e) => setShippingDimensions((d) => ({ ...d, width: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Height</label>
                  <input type="text" value={shippingDimensions.height} onChange={(e) => setShippingDimensions((d) => ({ ...d, height: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Specifications */}
        {activeTab === 6 && (
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDragSpecIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleSpecDrop(i)}
                className={`flex gap-2 items-center rounded-lg p-1 ${
                  dragSpecIdx === i ? "bg-primary/5 ring-1 ring-primary/20 opacity-50" : ""
                }`}
              >
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1">
                  <GripVertical className="w-4 h-4" />
                </div>
                <input placeholder="Key" value={s.label} onChange={(e) => updateSpec(i, "label", e.target.value)} className="w-40 border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
                <input placeholder="Value" value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
                <button type="button" onClick={() => removeSpec(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" onClick={addSpec} className="flex items-center gap-2 text-sm font-medium text-primary"><Plus className="w-4 h-4" /> Add Spec</button>
          </div>
        )}

        {/* FAQs */}
        {activeTab === 7 && (
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => setDragFaqIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleFaqDrop(i)}
                className={`border rounded-lg p-4 space-y-2 ${
                  dragFaqIdx === i ? "border-primary ring-1 ring-primary/20 opacity-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">#{i + 1}</span>
                  <button type="button" onClick={() => removeFaq(i)} className="ml-auto text-sm text-red-600 hover:underline">Remove</button>
                </div>
                <input placeholder="Question" value={f.question} onChange={(e) => updateFaq(i, "question", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
                <textarea placeholder="Answer" value={f.answer} onChange={(e) => updateFaq(i, "answer", e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" />
              </div>
            ))}
            <button type="button" onClick={addFaq} className="flex items-center gap-2 text-sm font-medium text-primary"><Plus className="w-4 h-4" /> Add FAQ</button>
          </div>
        )}

        {/* SEO */}
        {activeTab === 8 && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">SEO Title ({seoTitle.length}/60)</label>
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value.slice(0, 60))} maxLength={60} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" placeholder="Optimized title for search" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Meta Description ({metaDescription.length}/160)</label>
              <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value.slice(0, 160))} maxLength={160} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900" placeholder="Brief description for search results" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">GTIN</label>
                <input value={gtin} onChange={(e) => setGtin(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm" placeholder="Global Trade Item Number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">MPN</label>
                <input value={mpn} onChange={(e) => setMpn(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm" placeholder="Manufacturer Part Number" />
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Google snippet preview</p>
              <p className="text-blue-600 font-medium truncate">{seoTitle || "SEO Title"}</p>
              <p className="text-sm text-gray-600 truncate">{metaDescription || "Meta description"}</p>
            </div>
          </div>
        )}

        {/* Related */}
        {activeTab === 9 && (
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Add product IDs for manually curated related products.</p>
              <button
                type="button"
                onClick={suggestRelated}
                disabled={aiLoading}
                className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white px-4 py-1.5 rounded-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {aiLoading ? "Finding..." : "Suggest with AI"}
              </button>
            </div>
            {relatedProductIds.map((id, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={id}
                  onChange={(e) => setRelatedProductIds((ids) => ids.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder="Product ID"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-sm"
                />
                <button type="button" onClick={() => setRelatedProductIds((ids) => ids.filter((_, j) => j !== i))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setRelatedProductIds((ids) => [...ids, ""])} className="flex items-center gap-2 text-sm font-medium text-primary">
              <Plus className="w-4 h-4" /> Add Related Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
