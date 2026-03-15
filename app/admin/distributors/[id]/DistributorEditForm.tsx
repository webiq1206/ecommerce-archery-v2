"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Distributor = {
  id: string;
  name: string;
  contactName: string | null;
  email: string;
  ccEmails: string[] | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
};

export function DistributorEditForm({ distributor }: { distributor: Distributor }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const ccEmails = (formData.get("ccEmails") as string)?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
    try {
      const res = await fetch(`/api/admin/distributors/${distributor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          contactName: formData.get("contactName") || null,
          email: formData.get("email"),
          ccEmails: ccEmails.length ? ccEmails : null,
          phone: formData.get("phone") || null,
          notes: formData.get("notes") || null,
          isActive: formData.get("isActive") === "on",
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={distributor.name}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
          Contact name
        </label>
        <input
          id="contactName"
          name="contactName"
          type="text"
          defaultValue={distributor.contactName ?? ""}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={distributor.email}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="ccEmails" className="block text-sm font-medium text-gray-700 mb-1">
          CC emails (comma-separated)
        </label>
        <input
          id="ccEmails"
          name="ccEmails"
          type="text"
          defaultValue={distributor.ccEmails?.join(", ") ?? ""}
          placeholder="email1@example.com, email2@example.com"
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={distributor.phone ?? ""}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
        />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={distributor.notes ?? ""}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={distributor.isActive}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
