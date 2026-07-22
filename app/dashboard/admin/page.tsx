import Link from "next/link";
import { Users, Building2, Wrench, Coins, ClipboardCheck, Ban, FileBarChart, Star, Zap, BadgeCheck, CreditCard, Activity, Tags } from "lucide-react";
import { getAdminStats, getAdminAnalyticsSummary } from "@/lib/queries";

export const metadata = { title: "Admin — ภาพรวมระบบ" };

export default async function AdminOverviewPage() {
  const [stats, analyticsSummary] = await Promise.all([getAdminStats(), getAdminAnalyticsSummary()]);

  const cards = [
    { label: "ผู้ใช้ทั้งหมด", value: stats.userCount, icon: Users, href: "/dashboard/admin/users" },
    { label: "ที่พักทั้งหมด", value: stats.propertyCount, icon: Building2, href: "/dashboard/admin/listings" },
    { label: "ที่พักรออนุมัติ", value: stats.pendingPropertyCount, icon: ClipboardCheck, href: "/dashboard/admin/listings" },
    { label: "ผู้ให้บริการทั้งหมด", value: stats.providerCount, icon: Wrench, href: "/dashboard/admin/listings" },
    { label: "ผู้ให้บริการรออนุมัติ", value: stats.pendingProviderCount, icon: ClipboardCheck, href: "/dashboard/admin/listings" },
    { label: "บัญชีถูกระงับ", value: stats.suspendedUserCount, icon: Ban, href: "/dashboard/admin/users" },
    { label: "เหตุการณ์วันนี้", value: analyticsSummary.eventsToday, icon: Activity, href: undefined },
    { label: "การชำระเงินสำเร็จทั้งหมด", value: analyticsSummary.totalPayments, icon: CreditCard, href: "/dashboard/admin/boost-payments" },
    { label: "จัดการแต้มสมาชิก", value: null, icon: Coins, href: "/dashboard/admin/loyalty" },
    { label: "จัดการประกาศแนะนำ", value: null, icon: Star, href: "/dashboard/admin/featured" },
    { label: "จัดการดันประกาศ", value: null, icon: Zap, href: "/dashboard/admin/boost" },
    { label: "จัดการยืนยันที่พัก", value: null, icon: BadgeCheck, href: "/dashboard/admin/verification" },
    { label: "หมวดหมู่บริการ", value: null, icon: Tags, href: "/dashboard/admin/categories" },
    { label: "รายงานภาพรวม", value: null, icon: FileBarChart, href: "/dashboard/admin/reports" },

  ];

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">ภาพรวมระบบ (Admin)</h1>
      <p className="mt-1 text-sm text-ink-500">จัดการผู้ใช้ ประกาศที่พัก และผู้ให้บริการทั้งหมดของ Roomio</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) =>
          c.href ? (
            <Link
              key={c.label}
              href={c.href}
              className="flex flex-col gap-2 rounded-2xl border border-ink-100 p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <c.icon className="h-5 w-5 text-primary-600" />
              <span className="text-xs text-ink-500">{c.label}</span>
              {c.value !== null && <span className="text-2xl font-bold text-ink-900">{c.value}</span>}
            </Link>
          ) : (
            <div key={c.label} className="flex flex-col gap-2 rounded-2xl border border-ink-100 p-4 shadow-card">
              <c.icon className="h-5 w-5 text-primary-600" />
              <span className="text-xs text-ink-500">{c.label}</span>
              {c.value !== null && <span className="text-2xl font-bold text-ink-900">{c.value}</span>}
            </div>
          )
        )}
      </div>
    </div>
  );
}
