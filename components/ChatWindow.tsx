"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markConversationRead } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";
import type { MessageRow } from "@/types/database";

export default function ChatWindow({
  currentUserId,
  otherUserId,
  otherUserName,
  propertyId,
  serviceProviderId,
  initialMessages,
}: {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  propertyId?: string;
  serviceProviderId?: string;
  initialMessages: MessageRow[];
}) {
  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const threadKey = [currentUserId, otherUserId].sort().join("-") + "-" + (propertyId ?? serviceProviderId ?? "general");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, otherTyping]);

  // Mark the other person's messages as read on open
  useEffect(() => {
    markConversationRead(otherUserId, { propertyId, serviceProviderId });
  }, [otherUserId, propertyId, serviceProviderId]);

  // Realtime: new messages + read-status updates + typing broadcast
  useEffect(() => {
    const supabase = createClient();

    const dbChannel = supabase
      .channel(`chat-db-${threadKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${otherUserId}` },
        (payload) => {
          const row = payload.new as MessageRow;
          const matches = propertyId
            ? row.property_id === propertyId
            : serviceProviderId
              ? row.service_provider_id === serviceProviderId
              : !row.property_id && !row.service_provider_id;
          if (!matches || row.recipient_id !== currentUserId) return;

          setMessages((prev) => [...prev, row]);
          markConversationRead(otherUserId, { propertyId, serviceProviderId });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=eq.${currentUserId}` },
        (payload) => {
          const row = payload.new as MessageRow;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`chat-typing-${threadKey}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId === otherUserId) {
          setOtherTyping(true);
          if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
          otherTypingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [threadKey, otherUserId, currentUserId, propertyId, serviceProviderId]);

  function broadcastTyping() {
    const supabase = createClient();
    supabase.channel(`chat-typing-${threadKey}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId },
    });
  }

  function handleBodyChange(value: string) {
    setBody(value);
    broadcastTyping();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    const formData = new FormData();
    formData.set("recipient_id", otherUserId);
    if (propertyId) formData.set("property_id", propertyId);
    if (serviceProviderId) formData.set("service_provider_id", serviceProviderId);
    formData.set("body", text);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: MessageRow = {
      id: optimisticId,
      sender_id: currentUserId,
      recipient_id: otherUserId,
      property_id: propertyId ?? null,
      service_provider_id: serviceProviderId ?? null,
      body: text,
      status: "unread",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");

    const result = await sendMessage(formData);
    setSending(false);

    if (!result.success) {
      // Roll back the optimistic message instead of leaving a row that can
      // never be reconciled with a real id.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert(result.message);
      return;
    }

    if (result.data) {
      // Replace the optimistic entry with the persisted row so its real id
      // matches future realtime UPDATE events (e.g. the read receipt).
      const persisted = result.data;
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? persisted : m)));
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-ink-100">
      <div className="border-b border-ink-100 px-4 py-3">
        <p className="text-sm font-semibold text-ink-900">{otherUserName}</p>
        {otherTyping && <p className="text-xs text-ink-400">กำลังพิมพ์…</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink-500">เริ่มการสนทนาได้เลย</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const isMine = m.sender_id === currentUserId;
              return (
                <div key={m.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      isMine ? "bg-primary text-white" : "bg-ink-100 text-ink-900"
                    )}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 text-[10px] text-ink-400">
                    {new Date(m.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    {isMine && (m.status === "read" ? " · อ่านแล้ว" : " · ส่งแล้ว")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-ink-100 p-3">
        <input
          value={body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          className="flex-1 rounded-full border border-ink-300 px-4 py-2 text-sm focus-ring"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 focus-ring"
        >
          ส่ง
        </button>
      </form>
    </div>
  );
}
