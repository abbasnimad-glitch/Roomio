"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { approveBoostPayment } from "@/lib/actions/boost-payment";

export default function ApproveBoostPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    if (!window.confirm("อนุมัติการชำระเงินนี้และดันประกาศใช่หรือไม่?")) return;
    startTransition(async () => {
      const result = await approveBoostPayment(paymentId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleApprove}
      disabled={isPending}
      className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-white hover:bg-secondary-600 disabled:opacity-60"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      อนุมัติ
    </button>
  );
}
