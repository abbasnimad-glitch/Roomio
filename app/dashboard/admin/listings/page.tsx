import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import {
  getPendingProperties,
  getPendingServiceProviders,
  getApprovedPropertiesForAdmin,
  getApprovedServiceProvidersForAdmin,
} from "@/lib/queries";
import ApproveRejectButtons from "@/components/ApproveRejectButtons";
import DeleteListingButton from "@/components/DeleteListingButton";
import { formatBaht } from "@/lib/utils";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "อนุมัติประกาศ — Admin" };

export default async function AdminListingsPage() {
  const [properties, providers, approvedProperties, approvedProviders] = await Promise.all([
    getPendingProperties(),
    getPendingServiceProviders(),
    getApprovedPropertiesForAdmin(),
    getApprovedServiceProvidersForAdmin(),
  ]);

  return (
    <div className="container-app py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">คิวรออนุมัติ</h1>
          <p className="mt-1 text-sm text-ink-500">
            ที่พัก {properties.length} รายการ · ผู้ให้บริการ {providers.length} รายการ
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/owner/new"
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
          >
            <Plus className="h-4 w-4" /> เพิ่มที่พักใหม่
          </Link>
          <Link
            href="/dashboard/provider/new"
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
          >
            <Plus className="h-4 w-4" /> เพิ่มประกาศบริการใหม่
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900">ที่พักรออนุมัติ</h2>
        {properties.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
            ไม่มีที่พักรออนุมัติในขณะนี้
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {properties.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
                <div>
                  <Link href={`/property/${p.slug}`} target="_blank" className="flex items-center gap-1.5 font-semibold text-ink-900 hover:text-primary-600">
                    {p.name}
                    <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {p.district?.name_en} · {ROOM_TYPE_LABELS[p.room_type]} · {formatBaht(p.price_monthly)}/เดือน
                  </p>
                </div>
                <ApproveRejectButtons kind="property" id={p.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink-900">ผู้ให้บริการรออนุมัติ</h2>
        {providers.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
            ไม่มีผู้ให้บริการรออนุมัติในขณะนี้
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {providers.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
                <div>
                  <Link href={`/service/${s.slug}`} target="_blank" className="flex items-center gap-1.5 font-semibold text-ink-900 hover:text-primary-600">
                    {s.business_name}
                    <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-500">{s.category?.name_th ?? "—"} · {s.phone}</p>
                </div>
                <ApproveRejectButtons kind="service_provider" id={s.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      <hr className="my-10 border-ink-100" />

      <section>
        <h2 className="text-lg font-semibold text-ink-900">ที่พักที่อนุมัติแล้ว ({approvedProperties.length})</h2>
        <p className="mt-1 text-sm text-ink-500">แอดมินสามารถลบประกาศของเจ้าของที่พักคนใดก็ได้จากที่นี่</p>
        {approvedProperties.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
            ยังไม่มีที่พักที่อนุมัติแล้ว
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {approvedProperties.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
                <div>
                  <Link href={`/property/${p.slug}`} target="_blank" className="flex items-center gap-1.5 font-semibold text-ink-900 hover:text-primary-600">
                    {p.name}
                    <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {p.district?.name_en} · {ROOM_TYPE_LABELS[p.room_type]} · {formatBaht(p.price_monthly)}/เดือน
                    {p.owner?.full_name ? ` · เจ้าของ: ${p.owner.full_name}` : ""}
                  </p>
                </div>
                <DeleteListingButton kind="property" id={p.id} name={p.name} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink-900">ผู้ให้บริการที่อนุมัติแล้ว ({approvedProviders.length})</h2>
        <p className="mt-1 text-sm text-ink-500">แอดมินสามารถลบประกาศของผู้ให้บริการคนใดก็ได้จากที่นี่</p>
        {approvedProviders.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
            ยังไม่มีผู้ให้บริการที่อนุมัติแล้ว
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {approvedProviders.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
                <div>
                  <Link href={`/service/${s.slug}`} target="_blank" className="flex items-center gap-1.5 font-semibold text-ink-900 hover:text-primary-600">
                    {s.business_name}
                    <ExternalLink className="h-3.5 w-3.5 text-ink-400" />
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {s.category?.name_th ?? "—"} · {s.phone}
                    {s.owner?.full_name ? ` · เจ้าของ: ${s.owner.full_name}` : ""}
                  </p>
                </div>
                <DeleteListingButton kind="service_provider" id={s.id} name={s.business_name} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
