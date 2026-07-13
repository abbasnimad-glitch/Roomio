import { redirect } from "next/navigation";
import { getMyProfile, getMyLoyaltyTransactions } from "@/lib/queries";
import MembershipCard from "@/components/MembershipCard";

export const metadata = { title: "โปรไฟล์ของฉัน" };

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/auth/login?redirectTo=/profile");

  const transactions = await getMyLoyaltyTransactions(profile.id);

  return (
    <div className="container-app max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-ink-900">สวัสดีคุณ {profile.full_name}</h1>
      <p className="mt-1 text-sm text-ink-500">จัดการบัญชีและดูสิทธิประโยชน์สมาชิกของคุณ</p>

      <div className="mt-6">
        <MembershipCard points={profile.loyalty_points} transactions={transactions} />
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 p-5">
        <h2 className="text-sm font-semibold text-ink-900">ข้อมูลบัญชี</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-ink-500">เบอร์โทรศัพท์</dt><dd className="text-ink-900">{profile.phone ?? "ยังไม่ได้ระบุ"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">LINE ID</dt><dd className="text-ink-900">{profile.line_id ?? "ยังไม่ได้ระบุ"}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">สมัครสมาชิกเมื่อ</dt><dd className="text-ink-900">{new Date(profile.created_at).toLocaleDateString("th-TH")}</dd></div>
        </dl>
      </div>
    </div>
  );
}
