"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics/track";

interface ProductViewTrackerProps {
  productId: string;
  name: string;
  price: string;
  category?: string;
}

export function ProductViewTracker({ productId, name, price, category }: ProductViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    analytics.productViewed({ id: productId, name, price, category });
  }, [productId, name, price, category]);

  return null;
}
