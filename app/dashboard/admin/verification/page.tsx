import { getApprovedPropertiesForAdmin } from "@/lib/queries";
import { setPropertyVerified } from "@/lib/actions/admin";
import VerifiedToggle from "@/components/VerifiedToggle";
import { formatBaht } from "@/lib/utils";
import { ROOM_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "จัดการยืนยันที่พัก — Admin" };

export default async function AdminVerificationPage() {
  const properties = await getApprovedPropertiesForAdmin();

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">จัดการยืนยันที่พัก</h1>
      <p className="mt-1 text-sm text-ink-500">
        ยืนยันที่พักที่ผ่านการตรวจสอบจริง เพื่อสร้างความน่าเชื่อถือให้ผู้เช่า
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
                <VerifiedToggle id={p.id} isVerified={p.is_verified} onToggle={setPropertyVerified} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
