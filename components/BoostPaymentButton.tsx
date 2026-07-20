"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/actions/analytics";
import { BOOST_PLAN, BOOST_CONTACT_LINK } from "@/lib/constants";

export default function BoostPaymentButton({ propertyId }: { propertyId: string }) {
  function handleClick() {
    // Fire-and-forget — tracking must never block or delay the actual action.
    trackEvent("boost_click", "property", propertyId);
  }

  return (
    <Link
      href={BOOST_CONTACT_LINK}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="flex items-center gap-1 rounded-full border border-primary-300 px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50"
    >
      <MessageCircle className="h-3.5 w-3.5" />
      ดันประกาศ ({BOOST_PLAN.priceTHB} THB / {BOOST_PLAN.days} วัน)
    </Link>
  );
}
