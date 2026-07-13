"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CreditCard, QrCode, Loader2 } from "lucide-react";
import { selectBoostPaymentMethod } from "@/lib/actions/boost-payment";

export default function BoostPaymentMethodPicker({
  paymentId,
  propertyId,
  initialMethod,
}: {
  paymentId: string;
  propertyId: string;
  initialMethod: string | null;
}) {
  const [method, setMethod] = useState(initialMethod);
  const [isPending, startTransition] = useTransition();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStripe() {
    setError(null);
    setStripeLoading(true);
    try {
      const res = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, property_id: propertyId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error === "payment_unavailable" ? "ระบบชำระเงินขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง" : (data.error ?? "ไม่สามารถเริ่มการชำระเงินได้"));
        setStripeLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองใหม่อีกครั้ง");
      setStripeLoading(false);
    }
  }

  function handlePromptPay() {
    setError(null);
    startTransition(async () => {
      const result = await selectBoostPaymentMethod(paymentId, "promptpay");
      if (result.success) {
        setMethod("promptpay");
      } else {
        setError(result.message);
      }
    });
  }

  if (method === "promptpay") {
    return (
      <div className="rounded-2xl border border-ink-100 p-5 text-center">
        <p className="text-sm font-semibold text-ink-900">สแกน QR เพื่อชำระเงิน (ตัวอย่าง)</p>
        <div className="relative mx-auto mt-3 h-48 w-48">
          <Image src="/images/promptpay-qr.jpg" alt="PromptPay QR (placeholder)" fill className="rounded-xl object-contain" />
        </div>
        <p className="mt-3 text-xs text-ink-500">
          หลังโอนเงินแล้ว กรุณารอแอดมินตรวจสอบและยืนยันการชำระเงิน ระบบจะดันประกาศให้อัตโนมัติเมื่อได้รับการอนุมัติ
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleStripe}
        disabled={stripeLoading || isPending}
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
      >
        {stripeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        ชำระด้วยบัตร (Stripe)
      </button>
      <button
        type="button"
        onClick={handlePromptPay}
        disabled={stripeLoading || isPending}
        className="flex items-center justify-center gap-2 rounded-full border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-900 hover:bg-ink-100 disabled:opacity-60 focus-ring"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
        PromptPay
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
