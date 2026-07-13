"use client";

import { useEffect, useRef } from "react";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function SearchTracker({
  category,
  params,
  resultsCount,
}: {
  category: string;
  params: Record<string, string | undefined>;
  resultsCount: number;
}) {
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const hasActiveFilter = Object.values(params).some((v) => v);
    if (!hasActiveFilter) return;

    const key = JSON.stringify(params);
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    trackEvent(ANALYTICS_EVENTS.SEARCH, { category, results_count: resultsCount, ...params });
  }, [category, params, resultsCount]);

  return null;
}
