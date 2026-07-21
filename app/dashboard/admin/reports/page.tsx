import { getAdminReports } from "@/lib/queries";
import { LISTING_STATUS_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { ListingStatus, PropertyType, UserRole } from "@/types/database";

export const metadata = { title: "รายงาน — Admin" };

const ROLE_LABELS: Record<UserRole, string> = {
  guest: "ผู้เยี่ยมชม",
  user: "ผู้ใช้ทั่วไป",
  owner: "เจ้าของที่พัก",
  service_provider: "ผู้ให้บริการ",
  admin: "แอดมิน",
};

export default async function AdminReportsPage() {
  const report = await getAdminReports();

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">รายงานภาพรวม</h1>
      <p className="mt-1 text-sm text-ink-500">สรุปข้อมูลที่พัก ผู้ให้บริการ และผู้ใช้ทั้งหมดในระบบ</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ReportTable
          title="ที่พักตามสถานะ"
          rows={(Object.keys(LISTING_STATUS_LABELS) as ListingStatus[]).map((s) => ({
            label: LISTING_STATUS_LABELS[s],
            count: report.propertiesByStatus[s] ?? 0,
          }))}
        />
        <ReportTable
          title="ที่พักตามประเภท"
          rows={(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => ({
            label: PROPERTY_TYPE_LABELS[t],
            count: report.propertiesByType[t] ?? 0,
          }))}
        />
        <ReportTable
          title="ผู้ให้บริการตามสถานะ"
          rows={(Object.keys(LISTING_STATUS_LABELS) as ListingStatus[]).map((s) => ({
            label: LISTING_STATUS_LABELS[s],
            count: report.providersByStatus[s] ?? 0,
          }))}
        />
        <ReportTable title="ผู้ให้บริการตามหมวดหมู่" rows={report.providersByCategory} />
        <ReportTable
          title="ผู้ใช้ตามสิทธิ์การเข้าถึง"
          rows={(Object.keys(ROLE_LABELS) as UserRole[])
            .filter((r) => r !== "guest")
            .map((r) => ({ label: ROLE_LABELS[r], count: report.usersByRole[r] ?? 0 }))}
        />
        <ReportTable
          title="ที่พักตามอำเภอ"
          rows={report.propertiesByDistrict.map((d) => ({ label: d.district, count: d.count }))}
        />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink-900">ที่พักยอดนิยม (เฉพาะยอดสูงสุด)</h2>
        {report.topViewedProperties.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
            ยังไม่มีข้อมูลการเข้าชม
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-ink-100">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-ink-100/60 text-xs text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">ชื่อที่พัก</th>
                  <th className="px-4 py-3 font-semibold">อำเภอ</th>
                  <th className="px-4 py-3 font-semibold">ยอดเข้าชม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {report.topViewedProperties.map((p) => (
                  <tr key={p.name}>
                    <td className="px-4 py-3 font-medium text-ink-900">{p.name}</td>
                    <td className="px-4 py-3 text-ink-500">{p.district}</td>
                    <td className="px-4 py-3 text-ink-500">{p.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function ReportTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div className="rounded-2xl border border-ink-100 p-5">
      <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <dt className="text-ink-500">{r.label}</dt>
            <dd className="font-semibold text-ink-900">{r.count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
