"use client";

import { useEffect } from "react";
import { trackEvent as trackExternalEvent, ANALYTICS_EVENTS } from "@/lib/analytics";
import { trackEvent as trackAnalyticsEvent } from "@/lib/actions/analytics";

export default function PropertyViewTracker({
  propertyId,
  propertyName,
  price,
  district,
}: {
  propertyId: string;
  propertyName: string;
  price: number;
  district?: string;
}) {
  useEffect(() => {
    trackExternalEvent(ANALYTICS_EVENTS.PROPERTY_VIEW, {
      property_id: propertyId,
      property_name: propertyName,
      price,
      district,
    });

    // Basic guard against duplicate view spam on refresh/back-forward
    // navigation within the same tab session.
    const key = `roomio:viewed:${propertyId}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");

      const ref = new URLSearchParams(window.location.search).get("ref") ?? undefined;
      const referrer = document.referrer;
      const source = referrer.includes("facebook.com") ? "facebook" : referrer === "" ? "direct" : "unknown";

      trackAnalyticsEvent("view", "property", propertyId, { ref, source });
    }
    // Intentionally only re-fires if the property itself changes, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  return null;
}
