"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, AlertCircle, Plus, Trash2, Settings } from "lucide-react";

interface Distributor { id: string; name: string; email: string; }
interface Category { id: string; name: string; }
interface UnassignedProduct { id: string; name: string; sku: string; }
interface PendingOrder { id: string; orderNumber: string; status: string; fulfillmentStatus: string; createdAt: string; }
interface RoutingRule { id: string; categoryId: string; distributorId: string; }

export function FulfillmentClient({
  distributors,
  unassignedProducts,
  pendingOrders,
  categories = [],
  initialRoutingRules = [],
}: {
  distributors: Distributor[];
  unassignedProducts: UnassignedProduct[];
  pendingOrders: PendingOrder[];
  categories?: Category[];
  initialRoutingRules?: RoutingRule[];
}) {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [assignDistributor, setAssignDistributor] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkDistributor, setBulkDistributor] = useState("");
  const [loading, setLoading] = useState(false);

  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(initialRoutingRules);
  const [newRuleCategoryId, setNewRuleCategoryId] = useState("");
  const [newRuleDistributorId, setNewRuleDistributorId] = useState("");
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editDistributorId, setEditDistributorId] = useState("");
  const [rulesSaving, setRulesSaving] = useState(false);

  const handleAssignProducts = async () => {
    if (!assignDistributor || selectedProducts.size === 0) return;
    setLoading(true);
    try {
      await fetch("/api/admin/fulfillment/assign-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: Array.from(selectedProducts), distributorId: assignDistributor }),
      });
      setSelectedProducts(new Set());
      setAssignDistributor("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignOrders = async () => {
    if (!bulkDistributor || selectedOrders.size === 0) return;
    setLoading(true);
    try {
      await fetch("/api/admin/fulfillment/assign-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: Array.from(selectedOrders), distributorId: bulkDistributor }),
      });
      setSelectedOrders(new Set());
      setBulkDistributor("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const saveRules = async (rules: RoutingRule[]) => {
    setRulesSaving(true);
    try {
      const res = await fetch("/api/admin/fulfillment/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (res.ok) {
        setRoutingRules(rules);
      }
    } finally {
      setRulesSaving(false);
    }
  };

  const handleAddRule = () => {
    if (!newRuleCategoryId || !newRuleDistributorId) return;
    const exists = routingRules.some((r) => r.categoryId === newRuleCategoryId);
    if (exists) return;
    const newRule: RoutingRule = {
      id: crypto.randomUUID(),
      categoryId: newRuleCategoryId,
      distributorId: newRuleDistributorId,
    };
    const updated = [...routingRules, newRule];
    saveRules(updated);
    setNewRuleCategoryId("");
    setNewRuleDistributorId("");
  };

  const handleDeleteRule = (ruleId: string) => {
    const updated = routingRules.filter((r) => r.id !== ruleId);
    saveRules(updated);
  };

  const handleEditRule = (ruleId: string) => {
    if (!editDistributorId) return;
    const updated = routingRules.map((r) =>
      r.id === ruleId ? { ...r, distributorId: editDistributorId } : r
    );
    saveRules(updated);
    setEditingRule(null);
    setEditDistributorId("");
  };

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const getDistributorName = (id: string) => distributors.find((d) => d.id === id)?.name ?? id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Unassigned Products Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">Unassigned Products</h2>
        </div>
        {unassignedProducts.length === 0 ? (
          <p className="text-sm text-gray-500">All products are assigned to distributors.</p>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {unassignedProducts.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(p.id)}
                    onChange={(e) => {
                      const next = new Set(selectedProducts);
                      if (e.target.checked) next.add(p.id); else next.delete(p.id);
                      setSelectedProducts(next);
                    }}
                    className="rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{p.sku}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={assignDistributor} onChange={(e) => setAssignDistributor(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
                <option value="">Select distributor</option>
                {distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button
                onClick={handleAssignProducts}
                disabled={loading || !assignDistributor || selectedProducts.size === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
              >
                Assign <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pending Orders - Bulk Assignment */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Pending Orders</h2>
        </div>
        {pendingOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No pending orders to fulfill.</p>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {pendingOrders.map((order) => (
                <label key={order.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={(e) => {
                      const next = new Set(selectedOrders);
                      if (e.target.checked) next.add(order.id); else next.delete(order.id);
                      setSelectedOrders(next);
                    }}
                    className="rounded border-gray-300"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-100 text-yellow-800">{order.fulfillmentStatus}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={bulkDistributor} onChange={(e) => setBulkDistributor(e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900">
                <option value="">Select distributor</option>
                {distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button
                onClick={handleBulkAssignOrders}
                disabled={loading || !bulkDistributor || selectedOrders.size === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
              >
                Assign <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Routing Rules */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Routing Rules</h2>
          {rulesSaving && <span className="text-xs text-gray-400 ml-2">Saving...</span>}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Configure automatic distributor assignment based on product categories. When a new order comes in, products belonging to a mapped category are automatically routed to the assigned distributor.
        </p>

        {routingRules.length > 0 ? (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Category</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Distributor</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routingRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-900">{getCategoryName(rule.categoryId)}</td>
                    <td className="py-2 px-3">
                      {editingRule === rule.id ? (
                        <div className="flex gap-2">
                          <select
                            value={editDistributorId}
                            onChange={(e) => setEditDistributorId(e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900"
                          >
                            <option value="">Select</option>
                            {distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                          <button
                            onClick={() => handleEditRule(rule.id)}
                            disabled={!editDistributorId}
                            className="px-2 py-1 bg-primary text-white rounded text-xs font-medium disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingRule(null); setEditDistributorId(""); }}
                            className="px-2 py-1 text-gray-500 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-900">{getDistributorName(rule.distributorId)}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        {editingRule !== rule.id && (
                          <button
                            onClick={() => { setEditingRule(rule.id); setEditDistributorId(rule.distributorId); }}
                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No routing rules configured yet.</p>
        )}

        {distributors.length > 0 && categories.length > 0 ? (
          <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-gray-100">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={newRuleCategoryId}
                onChange={(e) => setNewRuleCategoryId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Select category</option>
                {categories
                  .filter((c) => !routingRules.some((r) => r.categoryId === c.id))
                  .map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Distributor</label>
              <select
                value={newRuleDistributorId}
                onChange={(e) => setNewRuleDistributorId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Select distributor</option>
                {distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button
              onClick={handleAddRule}
              disabled={!newRuleCategoryId || !newRuleDistributorId || rulesSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Rule
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {distributors.length === 0
              ? "Add distributors to set up routing rules."
              : "Add categories to set up routing rules."}
          </p>
        )}
      </div>
    </div>
  );
}
