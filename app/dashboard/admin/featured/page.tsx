import { getApprovedPropertiesForAdmin, getApprovedServiceProvidersForAdmin } from "@/lib/queries";
import { setPropertyFeatured, setServiceProviderFeatured } from "@/lib/actions/admin";
import FeaturedControl from "@/components/FeaturedControl";
import { formatBaht } from "@/lib/utils";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "จัดการประกาศแนะนำ — Admin" };

export default async function AdminFeaturedPage() {
  const [properties, providers] = await Promise.all([
    getApprovedPropertiesForAdmin(),
    getApprovedServiceProvidersForAdmin(),
  ]);

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">จัดการประกาศแนะนำ</h1>
      <p className="mt-1 text-sm text-ink-500">
        ตั้งค่าที่พักหรือผู้ให้บริการให้เป็น &ldquo;แนะนำ&rdquo; เพื่อแสดงเด่นเป็นลำดับต้นๆ ในผลการค้นหา
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900">ที่พัก ({properties.length})</h2>
        {properties.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
            ยังไม่มีที่พักที่อนุมัติแล้ว
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {properties.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
                <div>
                  <p className="font-semibold text-ink-900">{p.name}</p>
                  <p className="text-xs text-ink-500">
                    {p.district?.name_en} · {ROOM_TYPE_LABELS[p.room_type]} · {formatBaht(p.price_monthly)}/เดือน
                  </p>
                </div>
                <FeaturedControl
                  id={p.id}
                  currentIsFeatured={p.is_featured}
                  currentFeaturedUntil={p.featured_until}
                  onSave={setPropertyFeatured}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink-900">ผู้ให้บริการ ({providers.length})</h2>
        {providers.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
            ยังไม่มีผู้ให้บริการที่อนุมัติแล้ว
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {providers.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4">
                <div>
                  <p className="font-semibold text-ink-900">{s.business_name}</p>
                  <p className="text-xs text-ink-500">{s.category?.name_th ?? "—"} · {s.phone}</p>
                </div>
                <FeaturedControl
                  id={s.id}
                  currentIsFeatured={s.is_featured}
                  currentFeaturedUntil={s.featured_until}
                  onSave={setServiceProviderFeatured}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
