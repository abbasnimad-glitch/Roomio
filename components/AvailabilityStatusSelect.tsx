"use client";

import { useState, useTransition } from "react";
import { setPropertyAvailability } from "@/lib/actions/owner";
import { AVAILABILITY_LABELS } from "@/lib/constants";
import type { AvailabilityStatus } from "@/types/database";

export default function AvailabilityStatusSelect({
  propertyId,
  currentAvailability,
}: {
  propertyId: string;
  currentAvailability: AvailabilityStatus;
}) {
  const [availability, setAvailability] = useState(currentAvailability);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(next: AvailabilityStatus) {
    setAvailability(next);
    startTransition(async () => {
      const result = await setPropertyAvailability(propertyId, next);
      setMessage(result.success ? "บันทึกแล้ว" : result.message);
      if (!result.success) setAvailability(currentAvailability);
      setTimeout(() => setMessage(null), 2500);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={availability}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as AvailabilityStatus)}
        className="rounded-lg border border-ink-300 px-2 py-1.5 text-xs focus-ring disabled:opacity-60"
      >
        {(Object.keys(AVAILABILITY_LABELS) as AvailabilityStatus[]).map((a) => (
          <option key={a} value={a}>
            {AVAILABILITY_LABELS[a]}
          </option>
        ))}
      </select>
      {message && <span className="text-[11px] text-ink-400">{message}</span>}
    </div>
  );
}
