"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics/track";

interface OrderTrackerProps {
  orderId: string;
  total: number;
  itemCount: number;
}

export function OrderTracker({ orderId, total, itemCount }: OrderTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    analytics.orderCompleted(orderId, total);
    analytics.purchase({ orderId, revenue: total, items: itemCount });
  }, [orderId, total, itemCount]);

  return null;
}
