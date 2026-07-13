"use client";

import { useState, useTransition } from "react";
import { setServiceProviderAvailability } from "@/lib/actions/provider";

export default function ServiceAvailabilityToggle({
  providerId,
  currentIsAvailable,
}: {
  providerId: string;
  currentIsAvailable: boolean;
}) {
  const [isAvailable, setIsAvailable] = useState(currentIsAvailable);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(next: boolean) {
    setIsAvailable(next);
    startTransition(async () => {
      const result = await setServiceProviderAvailability(providerId, next);
      setMessage(result.success ? "บันทึกแล้ว" : result.message);
      if (!result.success) setIsAvailable(currentIsAvailable);
      setTimeout(() => setMessage(null), 2500);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={isAvailable ? "available" : "busy"}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value === "available")}
        className="rounded-lg border border-ink-300 px-2 py-1.5 text-xs focus-ring disabled:opacity-60"
      >
        <option value="available">พร้อมให้บริการ</option>
        <option value="busy">ไม่ว่าง</option>
      </select>
      {message && <span className="text-[11px] text-ink-400">{message}</span>}
    </div>
  );
}
