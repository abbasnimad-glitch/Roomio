import { getApprovedPropertiesForAdmin, getApprovedServiceProvidersForAdmin } from "@/lib/queries";
import { setPropertyBoost, setServiceProviderBoost } from "@/lib/actions/admin";
import BoostControl from "@/components/BoostControl";
import { formatBaht } from "@/lib/utils";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "จัดการดันประกาศ — Admin" };

export default async function AdminBoostPage() {
  const [properties, providers] = await Promise.all([
    getApprovedPropertiesForAdmin(),
    getApprovedServiceProvidersForAdmin(),
  ]);

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">จัดการดันประกาศ</h1>
      <p className="mt-1 text-sm text-ink-500">
        ตั้งค่าช่วงเวลาดันประกาศให้ที่พักหรือผู้ให้บริการ แสดงเด่นเป็นลำดับต้นๆ ในช่วงเวลาที่กำหนด
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
                <BoostControl
                  id={p.id}
                  currentIsBoosted={p.is_boosted}
                  currentBoostStartAt={p.boost_start_at}
                  currentBoostEndAt={p.boost_end_at}
                  onSave={setPropertyBoost}
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
                <BoostControl
                  id={s.id}
                  currentIsBoosted={s.is_boosted}
                  currentBoostStartAt={s.boost_start_at}
                  currentBoostEndAt={s.boost_end_at}
                  onSave={setServiceProviderBoost}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
