"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Circle, Clock, Package, Truck, CreditCard, XCircle, MailIcon } from "lucide-react";

type FulfillmentEntry = {
  id: string;
  distributorId: string;
  distributorName: string;
  status: string;
  notes: string | null;
};

type TimelineEvent = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
};

function EventTimeline({ events }: { events: TimelineEvent[] }) {
  const iconMap: Record<string, React.ReactNode> = {
    created: <Circle className="w-4 h-4 text-gray-400" />,
    payment: <CreditCard className="w-4 h-4 text-green-500" />,
    confirmed: <CheckCircle className="w-4 h-4 text-green-500" />,
    processing: <Clock className="w-4 h-4 text-blue-500" />,
    shipped: <Truck className="w-4 h-4 text-purple-500" />,
    delivered: <Package className="w-4 h-4 text-green-600" />,
    cancelled: <XCircle className="w-4 h-4 text-red-500" />,
    refund: <XCircle className="w-4 h-4 text-orange-500" />,
  };

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="p-1">{iconMap[event.type] ?? <Circle className="w-4 h-4 text-gray-400" />}</div>
            {i < events.length - 1 && <div className="w-px flex-1 bg-gray-200 min-h-[24px]" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium text-gray-900">{event.description}</p>
            <p className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</p>
          </div>
        </div>
      ))}
      {events.length === 0 && <p className="text-sm text-gray-500">No events recorded.</p>}
    </div>
  );
}

export function OrderDetailClient({
  orderId,
  status,
  trackingNumber,
  fulfillment,
  total,
  events = [],
}: {
  orderId: string;
  status: string;
  trackingNumber: string | null;
  fulfillment: FulfillmentEntry[];
  total: string;
  events?: TimelineEvent[];
}) {
  const router = useRouter();
  const [trackingValue, setTrackingValue] = useState(trackingNumber ?? "");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const updateOrder = async (body: Record<string, unknown>) => {
    setLoading("update");
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(null);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("refund");
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(refundAmount), reason: refundReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Refund failed");
      }
      setRefundAmount("");
      setRefundReason("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refund failed");
    } finally {
      setLoading(null);
    }
  };

  const handleResendFulfillment = async (fulfillmentLogId: string) => {
    setLoading(`resend-${fulfillmentLogId}`);
    setError(null);
    setResendSuccess(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-fulfillment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillmentLogId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resend email");
      }
      setResendSuccess(fulfillmentLogId);
      setTimeout(() => setResendSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resend email");
    } finally {
      setLoading(null);
    }
  };

  const handleAddTracking = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrder({ trackingNumber: trackingValue || undefined });
  };

  const handleMarkShipped = () => updateOrder({ status: "SHIPPED" });
  const handleCancelOrder = () => updateOrder({ status: "CANCELLED" });

  const defaultEvents: TimelineEvent[] = events.length > 0 ? events : [
    { id: "1", type: "created", description: "Order created", timestamp: new Date().toISOString() },
    ...(status === "CONFIRMED" || status === "SHIPPED" || status === "DELIVERED"
      ? [{ id: "2", type: "payment", description: "Payment confirmed", timestamp: new Date().toISOString() }]
      : []),
    ...(status === "SHIPPED" || status === "DELIVERED"
      ? [{ id: "3", type: "shipped", description: `Shipped${trackingNumber ? ` — ${trackingNumber}` : ""}`, timestamp: new Date().toISOString() }]
      : []),
    ...(status === "DELIVERED"
      ? [{ id: "4", type: "delivered", description: "Delivered", timestamp: new Date().toISOString() }]
      : []),
    ...(status === "CANCELLED"
      ? [{ id: "5", type: "cancelled", description: "Order cancelled", timestamp: new Date().toISOString() }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Timeline</h2>
        <EventTimeline events={defaultEvents} />
      </div>

      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Fulfillment</h2>
        {fulfillment.length > 0 ? (
          <div className="space-y-3">
            {fulfillment.map((f) => (
              <div key={f.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{f.distributorName}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${f.status === "SHIPPED" || f.status === "DELIVERED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {f.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {f.notes && <p className="text-sm text-gray-600">{f.notes}</p>}
                  <button
                    onClick={() => handleResendFulfillment(f.id)}
                    disabled={loading !== null}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                      resendSuccess === f.id
                        ? "bg-green-100 text-green-700"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <MailIcon className="w-3.5 h-3.5" />
                    {loading === `resend-${f.id}` ? "Sending..." : resendSuccess === f.id ? "Sent!" : "Re-send Email"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No fulfillment logs yet.</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Add Tracking</p>
            <form onSubmit={handleAddTracking} className="flex gap-2">
              <input
                value={trackingValue}
                onChange={(e) => setTrackingValue(e.target.value)}
                placeholder="Tracking number"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm"
              />
              <button
                type="submit"
                disabled={loading !== null}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Add Tracking
              </button>
            </form>
          </div>

          {status !== "SHIPPED" && status !== "DELIVERED" && status !== "CANCELLED" && status !== "REFUNDED" && (
            <button
              onClick={handleMarkShipped}
              disabled={loading !== null}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Mark Shipped
            </button>
          )}

          <form onSubmit={handleRefund} className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Issue Refund</p>
            <input
              type="number"
              step="0.01"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="Amount"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm"
            />
            <input
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm"
            />
            <button
              type="submit"
              disabled={loading !== null || !refundAmount}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {loading === "refund" ? "Processing..." : "Issue Refund"}
            </button>
          </form>

          {status !== "CANCELLED" && status !== "REFUNDED" && (
            <button
              onClick={handleCancelOrder}
              disabled={loading !== null}
              className="w-full px-4 py-2 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
