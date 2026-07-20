import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getMyProfile, getBoostPaymentById } from "@/lib/queries";
import { BOOST_PLAN, BOOST_CONTACT_LINK } from "@/lib/constants";
import { formatBaht } from "@/lib/utils";

export const metadata = { title: "ดันประกาศ" };

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
      <h1 className="text-2xl font-bold text-ink-900">ดันประกาศ</h1>
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

      <div className="mt-6 rounded-2xl border border-ink-100 p-5 text-center">
        <p className="text-sm text-ink-700">
          ขณะนี้การชำระเงินดันประกาศดำเนินการผ่านแอดมินโดยตรง กรุณาติดต่อทีมงานผ่าน Facebook Messenger
          เพื่อแจ้งความประสงค์และดำเนินการชำระเงิน ทีมงานจะดันประกาศให้หลังยืนยันการชำระเงินเรียบร้อยแล้ว
        </p>
        <a
          href={BOOST_CONTACT_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
        >
          <MessageCircle className="h-4 w-4" />
          ติดต่อทาง Messenger
        </a>
      </div>

      <Link href="/dashboard/owner" className="mt-6 inline-block text-sm text-ink-500 hover:underline">
        กลับไปที่แดชบอร์ด
      </Link>
    </div>
  );
}
