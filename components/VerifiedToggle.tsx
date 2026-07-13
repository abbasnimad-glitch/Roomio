"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, BadgeX } from "lucide-react";

export default function VerifiedToggle({
  id,
  isVerified,
  onToggle,
}: {
  id: string;
  isVerified: boolean;
  onToggle: (id: string, next: boolean) => Promise<{ success: boolean; message: string }>;
}) {
  const [verified, setVerified] = useState(isVerified);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function toggle() {
    const next = !verified;
    startTransition(async () => {
      const result = await onToggle(id, next);
      if (result.success) {
        setVerified(next);
      } else {
        setMessage(result.message);
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={isPending}
          className="flex items-center gap-1 rounded-full border border-secondary-300 px-3 py-1.5 text-xs font-semibold text-secondary-600 hover:bg-secondary-50 disabled:opacity-60"
        >
          <BadgeCheck className="h-3.5 w-3.5" /> ยืนยันแล้ว
        </button>
        {message && <span className="text-[11px] text-red-600">{message}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={isPending}
        className="flex items-center gap-1 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:opacity-60"
      >
        <BadgeX className="h-3.5 w-3.5" /> ยืนยันตัวตน
      </button>
      {message && <span className="text-[11px] text-red-600">{message}</span>}
    </div>
  );
}
