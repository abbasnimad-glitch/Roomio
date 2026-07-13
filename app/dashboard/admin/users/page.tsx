import { getAllProfiles } from "@/lib/queries";
import UserRoleSelect from "@/components/UserRoleSelect";
import SuspendUserButton from "@/components/SuspendUserButton";
import VerifiedToggle from "@/components/VerifiedToggle";
import { setProfileVerified } from "@/lib/actions/admin";

export const metadata = { title: "จัดการผู้ใช้ — Admin" };

export default async function AdminUsersPage() {
  const profiles = await getAllProfiles();

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-bold text-ink-900">จัดการผู้ใช้</h1>
      <p className="mt-1 text-sm text-ink-500">พบผู้ใช้ทั้งหมด {profiles.length} คน</p>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-100">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-ink-100/60 text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 font-semibold">ชื่อ</th>
              <th className="px-4 py-3 font-semibold">เบอร์โทร</th>
              <th className="px-4 py-3 font-semibold">แต้มสะสม</th>
              <th className="px-4 py-3 font-semibold">สมัครเมื่อ</th>
              <th className="px-4 py-3 font-semibold">สิทธิ์การใช้งาน</th>
              <th className="px-4 py-3 font-semibold">สถานะบัญชี</th>
              <th className="px-4 py-3 font-semibold">การยืนยันตัวตน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {profiles.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-ink-900">{p.full_name}</td>
                <td className="px-4 py-3 text-ink-500">{p.phone ?? "—"}</td>
                <td className="px-4 py-3 text-ink-500">{p.loyalty_points}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(p.created_at).toLocaleDateString("th-TH")}</td>
                <td className="px-4 py-3">
                  <UserRoleSelect userId={p.id} currentRole={p.role} />
                </td>
                <td className="px-4 py-3">
                  {p.role === "admin" ? (
                    <span className="text-xs text-ink-400">—</span>
                  ) : (
                    <SuspendUserButton userId={p.id} isSuspended={p.is_suspended} />
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.role === "owner" || p.role === "service_provider" ? (
                    <VerifiedToggle id={p.id} isVerified={p.is_verified} onToggle={setProfileVerified} />
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
