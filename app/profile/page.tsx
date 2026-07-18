import { redirect } from "next/navigation";
import { getMyProfile, getMyLoyaltyTransactions } from "@/lib/queries";
import MembershipCard from "@/components/MembershipCard";
import ProfileHeader from "@/components/ProfileHeader";
import ProfileForm from "@/components/ProfileForm";

export const metadata = { title: "โปรไฟล์ของฉัน" };

export default async function ProfilePage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/auth/login?redirectTo=/profile");

  const transactions = await getMyLoyaltyTransactions(profile.id);

  return (
    <div className="container-app max-w-2xl py-8">
      <ProfileHeader profile={profile} />

      <div className="mt-6">
        <MembershipCard points={profile.loyalty_points} transactions={transactions} />
      </div>

      <div className="mt-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
