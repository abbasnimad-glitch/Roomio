import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getMyProfile, getBoostPaymentById } from "@/lib/queries";
import { BOOST_PLAN } from "@/lib/constants";
import { formatBaht } from "@/lib/utils";
import BoostPaymentMethodPicker from "@/components/BoostPaymentMethodPicker";

export const metadata = { title: "ชำระเงินดันประกาศ" };

export default async function BoostPaymentPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;

  const [profile, payment] = await Promise.all([getMyProfile(), getBoostPaymentById(paymentId)]);
  if (!profile) redirect(`/auth/login?redirectTo=/dashboard/owner/boost/${paymentId}`);
  if (!payment) notFound();
  if (payment.user_id !== profile.id && profile.role !== "admin") notFound();

  if (payment.status === "paid") {
    redirect("/dashboard/owner");
  }

  return (
    <div className="container-app max-w-md py-12">
      <h1 className="text-2xl font-bold text-ink-900">ชำระเงินเพื่อดันประกาศ</h1>
      <p className="mt-1 text-sm text-ink-500">{payment.property?.name}</p>

      <div className="mt-6 rounded-2xl border border-ink-100 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">แพ็กเกจ</span>
          <span className="font-semibold text-ink-900">ดันประกาศ {BOOST_PLAN.days} วัน</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-ink-500">ราคา</span>
          <span className="font-semibold text-ink-900">{formatBaht(payment.amount)}</span>
        </div>
      </div>

      <div className="mt-6">
        <BoostPaymentMethodPicker paymentId={payment.id} propertyId={payment.property_id} initialMethod={payment.payment_method} />
      </div>

      <Link href="/dashboard/owner" className="mt-6 inline-block text-sm text-ink-500 hover:underline">
        กลับไปที่แดชบอร์ด
      </Link>
    </div>
  );
}
