// Google Analytics (GA4) provider. Isolated from PostHog so either can be
// added, removed, or swapped without touching call sites — see
// lib/analytics/events.ts for the provider-agnostic API consumers should use.

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function gtagPageview(url: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}

export function gtagEvent(name: string, params?: Record<string, unknown>): void {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
