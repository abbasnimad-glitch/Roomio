"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { createBoostPayment } from "@/lib/actions/boost-payment";
import { trackEvent } from "@/lib/actions/analytics";
import { BOOST_PLAN } from "@/lib/constants";

export default function BoostPaymentButton({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    // Fire-and-forget — tracking must never block or delay the actual action.
    trackEvent("boost_click", "property", propertyId);

    startTransition(async () => {
      const result = await createBoostPayment(propertyId);
      if (result.success && result.paymentId) {
        router.push(`/dashboard/owner/boost/${result.paymentId}`);
      } else {
        alert(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1 rounded-full border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 disabled:opacity-60"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
      Boost ({BOOST_PLAN.priceTHB} THB / {BOOST_PLAN.days} days)
    </button>
  );
}
