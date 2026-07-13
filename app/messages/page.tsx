import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyProfile, getMyConversations } from "@/lib/queries";

export const metadata = { title: "ข้อความ" };

export default async function MessagesPage() {
  const [profile, conversations] = await Promise.all([getMyProfile(), getMyConversations()]);
  if (!profile) redirect("/auth/login?redirectTo=/messages");

  return (
    <div className="container-app max-w-xl py-8">
      <h1 className="text-2xl font-bold text-ink-900">ข้อความ</h1>

      {conversations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
          ยังไม่มีข้อความ เริ่มทักทายเจ้าของที่พักหรือผู้ให้บริการได้เลย
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {conversations.map((c) => {
            const context = c.propertyName ?? c.serviceProviderName;
            const href = `/messages/${c.otherUser.id}${c.propertyId ? `?property=${c.propertyId}` : c.serviceProviderId ? `?provider=${c.serviceProviderId}` : ""}`;
            return (
              <Link
                key={c.key}
                href={href}
                className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4 hover:bg-ink-100/60 focus-ring"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{c.otherUser.full_name}</p>
                  {context && <p className="truncate text-xs text-primary-600">{context}</p>}
                  <p className="mt-0.5 truncate text-xs text-ink-500">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] font-semibold text-white">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
