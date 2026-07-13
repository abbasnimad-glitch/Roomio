import { gtagEvent, gtagPageview } from "@/lib/analytics/gtag";
import { posthogEvent, posthogPageview } from "@/lib/analytics/posthog";

// Central catalog of tracked event names, so call sites stay consistent and
// there's one place to see everything this app tracks.
export const ANALYTICS_EVENTS = {
  PROPERTY_VIEW: "property_view",
  SEARCH: "search",
  FAVORITE_ADD: "favorite_add",
  FAVORITE_REMOVE: "favorite_remove",
  CONTACT_OWNER: "contact_owner",
  CONTACT_TECHNICIAN: "contact_technician",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export function trackEvent(name: AnalyticsEventName, props?: Record<string, unknown>): void {
  gtagEvent(name, props);
  posthogEvent(name, props);
}

export function trackPageview(url: string): void {
  gtagPageview(url);
  posthogPageview(url);
}
