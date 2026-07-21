import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getPendingProperties, getPendingServiceProviders } from "@/lib/queries";
import ApproveRejectButtons from "@/components/ApproveRejectButtons";
import { formatBaht } from "@/lib/utils";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "อนุมัติประกาศ — Admin" };

export default async function AdminListingsPage() {
  const [properties, providers] = await Promise.all([getPendingProperties(), getPendingServiceProviders()]);

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">คิวรออนุมัติ</h1>
      <p className="mt-1 text-sm text-ink-500">
        ที่พัก {properties.length} รายการ · ผู้ให้บริการ {providers.length} รายการ
      </p>

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
    </div>
  );
}
