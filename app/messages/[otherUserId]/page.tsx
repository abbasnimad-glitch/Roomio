import { notFound, redirect } from "next/navigation";
import { getMyProfile, getProfileById, getConversationMessages } from "@/lib/queries";
import ChatWindow from "@/components/ChatWindow";

export const metadata = { title: "ข้อความ" };

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ otherUserId: string }>;
  searchParams: Promise<{ property?: string; provider?: string }>;
}) {
  const { otherUserId } = await params;
  const { property, provider } = await searchParams;

  const [profile, otherUser, messages] = await Promise.all([
    getMyProfile(),
    getProfileById(otherUserId),
    getConversationMessages(otherUserId, { propertyId: property, serviceProviderId: provider }),
  ]);
  if (!profile) redirect(`/auth/login?redirectTo=/messages/${otherUserId}`);
  if (!otherUser) notFound();

  return (
    <div className="container-app max-w-xl py-8">
      <ChatWindow
        currentUserId={profile.id}
        otherUserId={otherUser.id}
        otherUserName={otherUser.full_name}
        propertyId={property}
        serviceProviderId={provider}
        initialMessages={messages}
      />
    </div>
  );
}
