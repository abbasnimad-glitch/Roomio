"use server";

import { createClient } from "@/lib/supabase/server";
import type { AnalyticsEventType, AnalyticsTargetType } from "@/types/database";

// Safe by design: swallows all errors so a tracking failure (network
// blip, RLS edge case, etc.) never breaks the surrounding UI action.
// Works for guests — auth.getUser() simply returns no user, and
// user_id stays null, which the analytics_events RLS policy allows.
export async function trackEvent(
  eventType: AnalyticsEventType,
  targetType: AnalyticsTargetType,
  targetId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("analytics_events").insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      target_type: targetType,
      target_id: targetId,
      metadata: metadata ?? {},
    });
  } catch {
    // Analytics must never crash or block the caller.
  }
}
