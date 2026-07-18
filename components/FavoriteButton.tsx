"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function FavoriteButton({
  propertyId,
  serviceProviderId,
}: {
  propertyId?: string;
  serviceProviderId?: string;
}) {
  const [supabase] = useState(() => createClient());
  const [isFavorited, setIsFavorited] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const query = supabase
        .from("favorites")
        .select("id")
        .eq("user_id", uid);

      (propertyId ? query.eq("property_id", propertyId) : query.eq("service_provider_id", serviceProviderId!))
        .maybeSingle()
        .then(({ data }) => setIsFavorited(!!data));
    });
  }, [propertyId, serviceProviderId, supabase]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`favorites-${propertyId ?? serviceProviderId}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            property_id: string | null;
            service_provider_id: string | null;
          };
          const matchesTarget = propertyId
            ? row.property_id === propertyId
            : row.service_provider_id === serviceProviderId;
          if (!matchesTarget) return;

          if (payload.eventType === "INSERT") setIsFavorited(true);
          if (payload.eventType === "DELETE") setIsFavorited(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, propertyId, serviceProviderId, supabase]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      window.location.href = "/auth/login";
      return;
    }
    startTransition(async () => {
      if (isFavorited) {
        const query = supabase.from("favorites").delete().eq("user_id", userId);
        const { error: deleteError } = await (propertyId
          ? query.eq("property_id", propertyId)
          : query.eq("service_provider_id", serviceProviderId!));
        if (deleteError) {
          alert("ลบออกจากรายการโปรดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
          return;
        }
        setIsFavorited(false);
        trackEvent(ANALYTICS_EVENTS.FAVORITE_REMOVE, { property_id: propertyId, service_provider_id: serviceProviderId });
      } else {
        const { error: insertError } = await supabase.from("favorites").insert({
          user_id: userId,
          property_id: propertyId ?? null,
          service_provider_id: serviceProviderId ?? null,
        });
        if (insertError) {
          alert("บันทึกรายการโปรดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
          return;
        }
        setIsFavorited(true);
        trackEvent(ANALYTICS_EVENTS.FAVORITE_ADD, { property_id: propertyId, service_provider_id: serviceProviderId });
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={isFavorited}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur transition hover:scale-105 focus-ring"
    >
      <Heart
        className={cn("h-4 w-4 transition", isFavorited ? "fill-accent-500 text-accent-500" : "text-ink-700")}
      />
    </button>
  );
}