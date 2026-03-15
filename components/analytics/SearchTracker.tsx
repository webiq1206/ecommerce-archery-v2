"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/lib/analytics/track";

interface SearchTrackerProps {
  query: string;
  resultCount: number;
}

export function SearchTracker({ query, resultCount }: SearchTrackerProps) {
  const lastQuery = useRef("");

  useEffect(() => {
    if (!query || query === lastQuery.current) return;
    lastQuery.current = query;
    analytics.searchPerformed(query, resultCount);
  }, [query, resultCount]);

  return null;
}
