// PostHog provider. Isolated from GA4 so either can be added, removed, or
// swapped without touching call sites — see lib/analytics/events.ts for the
// provider-agnostic API consumers should use.
import posthog from "posthog-js";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

export function initPostHog(): void {
  if (!POSTHOG_KEY || initialized || typeof window === "undefined") return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // We track pageviews manually on route change (see components/Analytics.tsx)
    // since the App Router doesn't produce full page loads for navigations.
    capture_pageview: false,
    person_profiles: "identified_only",
  });
  initialized = true;
}

export function posthogPageview(url: string): void {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture("$pageview", { $current_url: url });
}

export function posthogEvent(name: string, params?: Record<string, unknown>): void {
  if (!POSTHOG_KEY || typeof window === "undefined") return;
  posthog.capture(name, params);
}
