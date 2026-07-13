"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth-helpers";
import type { MessageRow } from "@/types/database";

export interface MessageActionResult {
  success: boolean;
  message: string;
}

export interface SendMessageResult extends MessageActionResult {
  data?: MessageRow;
}

export async function sendMessage(formData: FormData): Promise<SendMessageResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบก่อนส่งข้อความ" };

  const recipientId = String(formData.get("recipient_id") ?? "");
  const propertyId = (formData.get("property_id") as string) || null;
  const serviceProviderId = (formData.get("service_provider_id") as string) || null;
  const body = String(formData.get("body") ?? "").trim();

  if (!recipientId) return { success: false, message: "ไม่พบผู้รับข้อความ" };
  if (!body) return { success: false, message: "กรุณาพิมพ์ข้อความ" };
  if (recipientId === user.id) return { success: false, message: "ไม่สามารถส่งข้อความถึงตัวเองได้" };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      recipient_id: recipientId,
      property_id: propertyId,
      service_provider_id: serviceProviderId,
      body,
    })
    .select()
    .single();

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/messages");
  return { success: true, message: "ส่งข้อความแล้ว", data: data as MessageRow };
}

export async function markConversationRead(
  otherUserId: string,
  target: { propertyId?: string; serviceProviderId?: string }
): Promise<MessageActionResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  let query = supabase
    .from("messages")
    .update({ status: "read" })
    .eq("recipient_id", user.id)
    .eq("sender_id", otherUserId)
    .eq("status", "unread");

  query = target.propertyId
    ? query.eq("property_id", target.propertyId)
    : target.serviceProviderId
      ? query.eq("service_provider_id", target.serviceProviderId)
      : query.is("property_id", null).is("service_provider_id", null);

  const { error } = await query;
  if (error) return { success: false, message: error.message };

  revalidatePath("/messages");
  return { success: true, message: "อ่านแล้ว" };
}
