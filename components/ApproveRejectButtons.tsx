"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { setPropertyStatus, setServiceProviderStatus } from "@/lib/actions/admin";

export default function ApproveRejectButtons({
  kind,
  id,
}: {
  kind: "property" | "service_provider";
  id: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  function act(status: "approved" | "rejected") {
    startTransition(async () => {
      const result =
        kind === "property" ? await setPropertyStatus(id, status) : await setServiceProviderStatus(id, status);
      if (result.success) setDone(status);
      else alert(result.message);
    });
  }

  if (done) {
    return (
      <span className={`text-sm font-medium ${done === "approved" ? "text-secondary-600" : "text-red-600"}`}>
        {done === "approved" ? "อนุมัติแล้ว ✓" : "ปฏิเสธแล้ว ✕"}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act("approved")}
        disabled={isPending}
        className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-white hover:bg-secondary-600 disabled:opacity-60"
      >
        <Check className="h-3.5 w-3.5" /> อนุมัติ
      </button>
      <button
        onClick={() => act("rejected")}
        disabled={isPending}
        className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        <X className="h-3.5 w-3.5" /> ปฏิเสธ
      </button>
    </div>
  );
}
