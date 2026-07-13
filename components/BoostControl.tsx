"use client";

import { useState, useTransition } from "react";

export default function BoostControl({
  id,
  currentIsBoosted,
  currentBoostStartAt,
  currentBoostEndAt,
  onSave,
}: {
  id: string;
  currentIsBoosted: boolean;
  currentBoostStartAt: string | null;
  currentBoostEndAt: string | null;
  onSave: (
    id: string,
    isBoosted: boolean,
    boostStartAt: string | null,
    boostEndAt: string | null
  ) => Promise<{ success: boolean; message: string }>;
}) {
  const [isBoosted, setIsBoosted] = useState(currentIsBoosted);
  const [startAt, setStartAt] = useState(currentBoostStartAt ? currentBoostStartAt.slice(0, 10) : "");
  const [endAt, setEndAt] = useState(currentBoostEndAt ? currentBoostEndAt.slice(0, 10) : "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    startTransition(async () => {
      const startIso = startAt ? new Date(startAt).toISOString() : null;
      const endIso = endAt ? new Date(endAt).toISOString() : null;
      const result = await onSave(id, isBoosted, startIso, endIso);
      setMessage(result.success ? "บันทึกแล้ว" : result.message);
      setTimeout(() => setMessage(null), 2500);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 text-xs text-ink-700">
        <input
          type="checkbox"
          checked={isBoosted}
          onChange={(e) => setIsBoosted(e.target.checked)}
          disabled={isPending}
          className="rounded"
        />
        ดันประกาศ
      </label>
      <label className="flex items-center gap-1 text-[11px] text-ink-500">
        เริ่ม
        <input
          type="date"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          disabled={isPending}
          aria-label="วันที่เริ่มดันประกาศ"
          className="rounded-lg border border-ink-300 px-2 py-1.5 text-xs focus-ring disabled:opacity-60"
        />
      </label>
      <label className="flex items-center gap-1 text-[11px] text-ink-500">
        สิ้นสุด
        <input
          type="date"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          disabled={isPending}
          aria-label="วันที่สิ้นสุดการดันประกาศ"
          className="rounded-lg border border-ink-300 px-2 py-1.5 text-xs focus-ring disabled:opacity-60"
        />
      </label>
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
