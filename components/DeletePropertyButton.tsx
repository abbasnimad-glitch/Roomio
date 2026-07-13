"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProperty } from "@/lib/actions/owner";

export default function DeletePropertyButton({
  propertyId,
  propertyName,
  redirectTo,
  onDelete = deleteProperty,
  confirmLabel,
}: {
  propertyId: string;
  propertyName: string;
  redirectTo?: string;
  /** Delete action to call. Defaults to the property delete action so existing usages are unaffected. */
  onDelete?: (id: string) => Promise<{ success: boolean; message: string }>;
  /** Override the confirm() prompt text (e.g. for deleting a service provider instead of a property). */
  confirmLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(confirmLabel ?? `ลบประกาศ "${propertyName}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`)) return;

    startTransition(async () => {
      const result = await onDelete(propertyId);
      if (!result.success) {
        alert(result.message);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      <Trash2 className="h-3.5 w-3.5" /> {isPending ? "กำลังลบ…" : "ลบ"}
    </button>
  );
}
