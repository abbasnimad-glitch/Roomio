"use client";

import { useState, useTransition } from "react";

export default function FeaturedControl({
  id,
  currentIsFeatured,
  currentFeaturedUntil,
  onSave,
}: {
  id: string;
  currentIsFeatured: boolean;
  currentFeaturedUntil: string | null;
  onSave: (id: string, isFeatured: boolean, featuredUntil: string | null) => Promise<{ success: boolean; message: string }>;
}) {
  const [isFeatured, setIsFeatured] = useState(currentIsFeatured);
  const [featuredUntil, setFeaturedUntil] = useState(currentFeaturedUntil ? currentFeaturedUntil.slice(0, 10) : "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      const isoDate = featuredUntil ? new Date(featuredUntil).toISOString() : null;
      const result = await onSave(id, isFeatured, isoDate);
      setMessage(result.success ? "บันทึกแล้ว" : result.message);
      setTimeout(() => setMessage(null), 2500);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs text-ink-700">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          disabled={isPending}
          className="rounded"
        />
        แนะนำ
      </label>
      <input
        type="date"
        value={featuredUntil}
        onChange={(e) => setFeaturedUntil(e.target.value)}
        disabled={isPending}
        aria-label="วันหมดอายุการแนะนำ"
        className="rounded-lg border border-ink-300 px-2 py-1.5 text-xs focus-ring disabled:opacity-60"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-ink-100 disabled:opacity-60"
      >
        {isPending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
      {message && <span className="text-[11px] text-ink-400">{message}</span>}
    </div>
  );
}
