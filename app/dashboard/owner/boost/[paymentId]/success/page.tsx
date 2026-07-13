import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { confirmBoostPayment } from "@/lib/actions/boost-payment";

export const metadata = { title: "ผลการชำระเงิน" };

export default async function BoostPaymentSuccessPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const result = await confirmBoostPayment(paymentId);
  const failureMessage = result.reason === "stripe_error" ? "ยังไม่สามารถยืนยันการชำระเงินได้ กรุณาลองใหม่" : result.message;

  return (
    <div className="container-app flex min-h-[60vh] max-w-md flex-col items-center justify-center py-12 text-center">
      {result.success ? (
        <>
          <CheckCircle2 className="h-12 w-12 text-secondary-600" />
          <h1 className="mt-4 text-xl font-bold text-ink-900">ชำระเงินสำเร็จ</h1>
          <p className="mt-1 text-sm text-ink-500">{result.message}</p>
        </>
      ) : (
        <>
          <XCircle className="h-12 w-12 text-red-600" />
          <h1 className="mt-4 text-xl font-bold text-ink-900">ยังไม่สำเร็จ</h1>
          <p className="mt-1 text-sm text-ink-500">{failureMessage}</p>
        </>
      )}
      <Link
        href="/dashboard/owner"
        className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
      >
        กลับไปที่แดชบอร์ด
      </Link>
    </div>
  );
}
