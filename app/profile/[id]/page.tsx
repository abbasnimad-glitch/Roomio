import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { Facebook, Instagram, MessageCircle, User as UserIcon } from "lucide-react";
import { getMyProfile, getProfileById } from "@/lib/queries";
import { publicImageUrl } from "@/lib/utils";
import AdminEditProfileForm from "@/components/AdminEditProfileForm";

const ROLE_LABELS: Record<string, string> = {
  user: "ผู้ใช้ทั่วไป",
  owner: "เจ้าของที่พัก",
  service_provider: "ผู้ให้บริการ",
  admin: "แอดมิน",
};

export const metadata = { title: "โปรไฟล์ผู้ใช้" };

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const viewer = await getMyProfile();
  if (!viewer) redirect(`/auth/login?redirectTo=/profile/${id}`);

  // Viewing your own profile through this route just sends you to the
  // editable /profile page instead of duplicating that UI here.
  if (viewer.id === id) redirect("/profile");

  const target = await getProfileById(id);
  if (!target) notFound();

  const avatarSrc = target.avatar_url ? publicImageUrl("avatars", target.avatar_url) : null;
  const memberSince = new Date(target.created_at).toLocaleDateString("th-TH");

  return (
    <div className="container-app max-w-lg py-10">
      <div className="rounded-2xl border border-ink-100 p-6 text-center">
        <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-ink-100">
          {avatarSrc ? (
            <Image src={avatarSrc} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-400">
              <UserIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <h1 className="mt-4 text-xl font-bold text-ink-900">{target.full_name}</h1>
        <span className="mt-1 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
          {ROLE_LABELS[target.role] ?? target.role}
        </span>
        <p className="mt-2 text-xs text-ink-400">สมัครสมาชิกเมื่อ {memberSince}</p>

        {(target.line_id || target.facebook_url || target.instagram_url) && (
          <div className="mt-5 flex flex-col items-center gap-2">
            {target.line_id && (
              <span className="flex items-center gap-2 text-sm text-ink-700">
                <MessageCircle className="h-4 w-4 text-secondary-600" /> LINE: {target.line_id}
              </span>
            )}
            {target.facebook_url && (
              <a
                href={target.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <Facebook className="h-4 w-4" /> Facebook
              </a>
            )}
            {target.instagram_url && (
              <a
                href={target.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
              >
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
          </div>
        )}

        <a
          href={`/messages/${target.id}`}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 focus-ring"
        >
          <MessageCircle className="h-4 w-4" /> ส่งข้อความ
        </a>
      </div>

      {viewer.role === "admin" && (
        <div className="mt-6">
          <AdminEditProfileForm profile={target} />
        </div>
      )}
    </div>
  );
}
