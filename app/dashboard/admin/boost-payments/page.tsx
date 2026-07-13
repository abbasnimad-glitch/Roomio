import Link from "next/link";
import { getBoostPaymentsForAdmin } from "@/lib/queries";
import { formatBaht, cn } from "@/lib/utils";
import { BOOST_PAYMENT_STATUS_LABELS, BOOST_PAYMENT_STATUS_COLORS } from "@/lib/constants";
import ApproveBoostPaymentButton from "@/components/ApproveBoostPaymentButton";
import type { BoostPaymentStatus } from "@/types/database";

export const metadata = { title: "การชำระเงินดันประกาศ — Admin" };

export default async function AdminBoostPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status === "pending" ? "pending" : undefined;
  const payments = await getBoostPaymentsForAdmin(filter as BoostPaymentStatus | undefined);

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">การชำระเงินดันประกาศ</h1>
      <p className="mt-1 text-sm text-ink-500">ตรวจสอบและอนุมัติการชำระเงินแบบ PromptPay ด้วยตนเอง</p>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <Link
          href="/dashboard/admin/boost-payments"
          className={cn(
            "rounded-full px-3 py-1.5 font-semibold",
            !filter ? "bg-primary text-white" : "border border-ink-300 text-ink-700 hover:bg-ink-100"
          )}
        >
          ทั้งหมด
        </Link>
        <Link
          href="/dashboard/admin/boost-payments?status=pending"
          className={cn(
            "rounded-full px-3 py-1.5 font-semibold",
            filter === "pending" ? "bg-primary text-white" : "border border-ink-300 text-ink-700 hover:bg-ink-100"
          )}
        >
          รอชำระเงิน
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
          ไม่พบรายการชำระเงิน
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink-900">{p.property?.name ?? "—"}</p>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", BOOST_PAYMENT_STATUS_COLORS[p.status])}>
                    {BOOST_PAYMENT_STATUS_LABELS[p.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {formatBaht(p.amount)} · {p.payment_method ?? "ยังไม่เลือกช่องทาง"} · สร้างเมื่อ{" "}
                  {new Date(p.created_at).toLocaleDateString("th-TH")}
                  {p.paid_at && <> · ชำระเมื่อ {new Date(p.paid_at).toLocaleDateString("th-TH")}</>}
                </p>
              </div>
              {p.status === "pending" && p.payment_method === "promptpay" && (
                <ApproveBoostPaymentButton paymentId={p.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
