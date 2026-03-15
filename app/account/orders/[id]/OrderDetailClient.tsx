"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";

export function OrderDetailClient({ orderId, status }: { orderId: string; status: string }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (status !== "DELIVERED" || submitted) {
    if (submitted) {
      return (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm text-emerald-400 font-medium">
            Return request submitted. We&apos;ll review it and contact you shortly.
          </p>
        </div>
      );
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to submit return request. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-card p-5">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Request Return
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="font-display text-sm uppercase tracking-wider text-white/80">
            Request a Return
          </h3>
          <div>
            <label className="block text-xs text-white/50 mb-1">
              Reason for return *
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe why you'd like to return this order..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit Return Request"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setReason("");
              }}
              className="px-4 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/5 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
