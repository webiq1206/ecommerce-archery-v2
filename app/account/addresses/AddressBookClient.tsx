"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Address } from "@/lib/db";

function formatAddress(addr: Address) {
  const parts = [
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

interface AddressBookClientProps {
  initialAddresses: Address[];
}

export function AddressBookClient({ initialAddresses }: AddressBookClientProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    firstName: "",
    lastName: "",
    company: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    isDefault: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      label: "",
      firstName: "",
      lastName: "",
      company: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      isDefault: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (addr: Address) => {
    setFormData({
      label: addr.label ?? "",
      firstName: addr.firstName,
      lastName: addr.lastName,
      company: addr.company ?? "",
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await fetch(`/api/account/addresses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Update failed");
        const updated = await res.json();
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingId ? updated : a))
        );
      } else {
        const res = await fetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error("Add failed");
        const created = await res.json();
        setAddresses((prev) => [...prev, created]);
      }
      resetForm();
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="rounded-xl border border-white/5 bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              {(addr.label || addr.isDefault) && (
                <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">
                  {addr.label || (addr.isDefault ? "Default" : "")}
                </p>
              )}
              <p className="text-white/90">
                {addr.firstName} {addr.lastName}
              </p>
              <p className="text-sm text-white/60">{formatAddress(addr)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(addr)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Edit address"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {deleteConfirm === addr.id ? (
                <span className="flex gap-2">
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-xs px-2 py-1 rounded bg-white/10 text-white/70"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(addr.id)}
                  className="p-2 rounded-lg text-white/60 hover:text-destructive hover:bg-white/5 transition-colors"
                  aria-label="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/5 bg-card p-6 space-y-4"
        >
          <h3 className="font-display text-sm uppercase tracking-wider text-white/80">
            {editingId ? "Edit Address" : "Add Address"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, label: e.target.value }))
                }
                placeholder="Home, Work, etc."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, isDefault: e.target.checked }))
                }
                className="rounded border-white/20"
              />
              <label htmlFor="isDefault" className="text-sm text-white/70">
                Set as default address
              </label>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">
                First name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, firstName: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">
                Last name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, lastName: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, company: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1">
                Address line 1 *
              </label>
              <input
                type="text"
                required
                value={formData.line1}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, line1: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-white/50 mb-1">
                Address line 2
              </label>
              <input
                type="text"
                value={formData.line2}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, line2: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, city: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, state: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">ZIP *</label>
              <input
                type="text"
                required
                value={formData.zip}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, zip: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Country *</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, country: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              {editingId ? "Update" : "Add"} Address
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              label: "",
              firstName: "",
              lastName: "",
              company: "",
              line1: "",
              line2: "",
              city: "",
              state: "",
              zip: "",
              country: "US",
              isDefault: false,
            });
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/20 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      )}
    </div>
  );
}
