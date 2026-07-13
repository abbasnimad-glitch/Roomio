import Link from "next/link";
import { Wrench, ClipboardCheck, CheckCircle2, Star, Plus, MessageCircle } from "lucide-react";
import { getProviderListings, getProviderStats } from "@/lib/queries";
import { cn, isCurrentlyFeatured, isCurrentlyBoosted } from "@/lib/utils";
import { SERVICE_CATEGORY_LABELS, LISTING_STATUS_LABELS, LISTING_STATUS_COLORS } from "@/lib/constants";
import ServiceAvailabilityToggle from "@/components/ServiceAvailabilityToggle";
import DeletePropertyButton from "@/components/DeletePropertyButton";
import FeaturedBadge from "@/components/FeaturedBadge";
import BoostBadge from "@/components/BoostBadge";
import { deleteServiceProvider } from "@/lib/actions/provider";

export const metadata = { title: "แดชบอร์ดผู้ให้บริการ" };

export default async function ProviderDashboardPage() {
  const listings = await getProviderListings();
  const stats = await getProviderStats(listings);

  const statCards = [
    { label: "ประกาศทั้งหมด", value: stats.total, icon: Wrench, href: undefined },
    { label: "รออนุมัติ", value: stats.pending, icon: ClipboardCheck, href: undefined },
    { label: "อนุมัติแล้ว", value: stats.approved, icon: CheckCircle2, href: undefined },
    { label: "คะแนนเฉลี่ย", value: stats.avgRating, icon: Star, href: undefined },
    { label: "ข้อความ", value: null, icon: MessageCircle, href: "/messages" },
  ];

  return (
    <div className="container-app py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">แดชบอร์ดผู้ให้บริการ</h1>
          <p className="mt-1 text-sm text-ink-500">จัดการประกาศบริการของคุณ</p>
        </div>
        <Link
          href="/dashboard/provider/new"
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
        >
          <Plus className="h-4 w-4" /> เพิ่มประกาศใหม่
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {statCards.map((c) =>
          c.href ? (
            <Link
              key={c.label}
              href={c.href}
              className="flex flex-col gap-2 rounded-2xl border border-ink-100 p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <c.icon className="h-5 w-5 text-primary-600" />
              <span className="text-xs text-ink-500">{c.label}</span>
            </Link>
          ) : (
            <div key={c.label} className="flex flex-col gap-2 rounded-2xl border border-ink-100 p-4 shadow-card">
              <c.icon className="h-5 w-5 text-primary-600" />
              <span className="text-xs text-ink-500">{c.label}</span>
              <span className="text-2xl font-bold text-ink-900">{c.value}</span>
            </div>
          )
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900">ประกาศของฉัน</h2>

        {listings.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
            คุณยังไม่มีประกาศ เริ่มเพิ่มบริการแรกของคุณได้เลย
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {listings.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-900">{p.business_name}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", LISTING_STATUS_COLORS[p.status])}>
                      {LISTING_STATUS_LABELS[p.status]}
                    </span>
                    {isCurrentlyBoosted(p.is_boosted, p.boost_start_at, p.boost_end_at) && <BoostBadge />}
                    {isCurrentlyFeatured(p.is_featured, p.featured_until) && <FeaturedBadge />}
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {SERVICE_CATEGORY_LABELS[p.category]} · ให้บริการ {p.working_districts.length} อำเภอ · คะแนน {p.rating_avg.toFixed(1)} ({p.rating_count})
                    {isCurrentlyFeatured(p.is_featured, p.featured_until) && p.featured_until && (
                      <> · แนะนำถึง {new Date(p.featured_until).toLocaleDateString("th-TH")}</>
                    )}
                    {isCurrentlyBoosted(p.is_boosted, p.boost_start_at, p.boost_end_at) && p.boost_end_at && (
                      <> · ดันประกาศถึง {new Date(p.boost_end_at).toLocaleDateString("th-TH")}</>
                    )}
                  </p>
                </div>

                <ServiceAvailabilityToggle providerId={p.id} currentIsAvailable={p.is_available} />

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/provider/${p.id}/edit`}
                    className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-ink-100 focus-ring"
                  >
                    แก้ไข
                  </Link>
                  <DeletePropertyButton
                    propertyId={p.id}
                    propertyName={p.business_name}
                    onDelete={deleteServiceProvider}
                    confirmLabel={`ลบประกาศ "${p.business_name}" ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
