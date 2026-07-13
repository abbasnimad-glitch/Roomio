"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { trackEvent as trackExternalEvent, type AnalyticsEventName } from "@/lib/analytics";
import { trackEvent as trackAnalyticsEvent } from "@/lib/actions/analytics";
import type { AnalyticsTargetType } from "@/types/database";

export default function TrackedLink({
  eventName,
  eventProps,
  analyticsTargetType,
  analyticsTargetId,
  onClick,
  ...anchorProps
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: AnalyticsEventName;
  eventProps?: Record<string, unknown>;
  /** When provided alongside analyticsTargetId, also logs a click_phone/click_line/click_contact event to the in-house analytics_events table. */
  analyticsTargetType?: AnalyticsTargetType;
  analyticsTargetId?: string;
}) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    trackExternalEvent(eventName, eventProps);

    if (analyticsTargetType && analyticsTargetId) {
      const method = eventProps?.method;
      const inHouseEventType = method === "call" ? "click_phone" : method === "line" ? "click_line" : "click_contact";
      trackAnalyticsEvent(inHouseEventType, analyticsTargetType, analyticsTargetId, { method });
    }

    onClick?.(e);
  }

  return <a {...anchorProps} onClick={handleClick} />;
}
