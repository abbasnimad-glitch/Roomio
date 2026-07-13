import Link from "next/link";
import { Building2, ClipboardCheck, CheckCircle2, Eye, Plus } from "lucide-react";
import { getOwnerProperties, getOwnerStats, getPropertyStats } from "@/lib/queries";
import { formatBaht, cn, isCurrentlyFeatured, isCurrentlyBoosted } from "@/lib/utils";
import { ROOM_TYPE_LABELS, LISTING_STATUS_LABELS, LISTING_STATUS_COLORS } from "@/lib/constants";
import AvailabilityStatusSelect from "@/components/AvailabilityStatusSelect";
import DeletePropertyButton from "@/components/DeletePropertyButton";
import FeaturedBadge from "@/components/FeaturedBadge";
import BoostBadge from "@/components/BoostBadge";
import BoostPaymentButton from "@/components/BoostPaymentButton";

export const metadata = { title: "แดชบอร์ดเจ้าของที่พัก" };

export default async function OwnerDashboardPage() {
  const properties = await getOwnerProperties();
  const stats = await getOwnerStats(properties);
  const propertyStats = await Promise.all(properties.map((p) => getPropertyStats(p.id)));

  const statCards = [
    { label: "ประกาศทั้งหมด", value: stats.total, icon: Building2 },
    { label: "รออนุมัติ", value: stats.pending, icon: ClipboardCheck },
    { label: "อนุมัติแล้ว", value: stats.approved, icon: CheckCircle2 },
    { label: "ยอดเข้าชมรวม", value: stats.totalViews, icon: Eye },
  ];

  return (
    <div className="container-app py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">แดชบอร์ดเจ้าของที่พัก</h1>
          <p className="mt-1 text-sm text-ink-500">จัดการประกาศที่พักของคุณ</p>
          <p className="mt-1 text-xs text-ink-400">แชร์ประกาศของคุณลง Facebook เพื่อเพิ่มผู้เช่า</p>
        </div>
        <Link
          href="/dashboard/owner/new"
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
        >
          <Plus className="h-4 w-4" /> เพิ่มประกาศใหม่
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="flex flex-col gap-2 rounded-2xl border border-ink-100 p-4 shadow-card">
            <c.icon className="h-5 w-5 text-primary-600" />
            <span className="text-xs text-ink-500">{c.label}</span>
            <span className="text-2xl font-bold text-ink-900">{c.value}</span>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900">ประกาศของฉัน</h2>

        {properties.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
            คุณยังไม่มีประกาศ เริ่มเพิ่มที่พักแรกของคุณได้เลย
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {properties.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-900">{p.name}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", LISTING_STATUS_COLORS[p.status])}>
                      {LISTING_STATUS_LABELS[p.status]}
                    </span>
                    {isCurrentlyBoosted(p.is_boosted, p.boost_start_at, p.boost_end_at) && <BoostBadge />}
                    {isCurrentlyFeatured(p.is_featured, p.featured_until) && <FeaturedBadge />}
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {p.district?.name_en} · {ROOM_TYPE_LABELS[p.room_type]} · {formatBaht(p.price_monthly)}/เดือน · เข้าชม {p.view_count} ครั้ง
                    {isCurrentlyFeatured(p.is_featured, p.featured_until) && p.featured_until && (
                      <> · แนะนำถึง {new Date(p.featured_until).toLocaleDateString("th-TH")}</>
                    )}
                    {isCurrentlyBoosted(p.is_boosted, p.boost_start_at, p.boost_end_at) && p.boost_end_at && (
                      <> · ดันประกาศถึง {new Date(p.boost_end_at).toLocaleDateString("th-TH")}</>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    สถิติ: เข้าชม {propertyStats[i].views} · ติดต่อ {propertyStats[i].contacts} · คลิกทั้งหมด {propertyStats[i].totalClicks}
                  </p>
                </div>

                <AvailabilityStatusSelect propertyId={p.id} currentAvailability={p.availability} />

                <div className="flex items-center gap-2">
                  {!isCurrentlyBoosted(p.is_boosted, p.boost_start_at, p.boost_end_at) && (
                    <BoostPaymentButton propertyId={p.id} />
                  )}
                  <Link
                    href={`/dashboard/owner/${p.id}/edit`}
                    className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-ink-100 focus-ring"
                  >
                    แก้ไข
                  </Link>
                  <DeletePropertyButton propertyId={p.id} propertyName={p.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
