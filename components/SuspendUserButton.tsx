"use client";

import { useState, useTransition } from "react";
import { Ban, RotateCcw } from "lucide-react";
import { setUserSuspended } from "@/lib/actions/admin";

export default function SuspendUserButton({
  userId,
  isSuspended,
}: {
  userId: string;
  isSuspended: boolean;
}) {
  const [suspended, setSuspended] = useState(isSuspended);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function toggle() {
    const next = !suspended;
    startTransition(async () => {
      const result = await setUserSuspended(userId, next);
      if (result.success) {
        setSuspended(next);
      } else {
        setMessage(result.message);
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  if (suspended) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          disabled={isPending}
          className="flex items-center gap-1 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:opacity-60"
        >
          <RotateCcw className="h-3.5 w-3.5" /> ยกเลิกการระงับ
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
        className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        <Ban className="h-3.5 w-3.5" /> ระงับบัญชี
      </button>
      {message && <span className="text-[11px] text-red-600">{message}</span>}
    </div>
  );
}
