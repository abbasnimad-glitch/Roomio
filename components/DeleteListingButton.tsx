"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePropertyAsAdmin, deleteServiceProviderAsAdmin } from "@/lib/actions/admin";

export default function DeleteListingButton({
  kind,
  id,
  name,
}: {
  kind: "property" | "service_provider";
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm(`ลบประกาศ "${name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`)) return;
    setError(null);
    startTransition(async () => {
      const result =
        kind === "property" ? await deletePropertyAsAdmin(id) : await deleteServiceProviderAsAdmin(id);
      if (result.success) {
        setDeleted(true);
      } else {
        setError(result.message);
      }
    });
  }

  if (deleted) {
    return <span className="text-sm font-medium text-red-600">ลบแล้ว ✕</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" /> {isPending ? "กำลังลบ…" : "ลบ"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
