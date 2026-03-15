"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics/track";

interface GuideViewTrackerProps {
  slug: string;
  title: string;
}

export function GuideViewTracker({ slug, title }: GuideViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    analytics.guideViewed({ slug, title });
  }, [slug, title]);

  return null;
}
