"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth-helpers";

export interface NotificationActionResult {
  success: boolean;
  message: string;
}

export async function markNotificationRead(notificationId: string): Promise<NotificationActionResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "อ่านแล้ว" };
}

export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false, message: error.message };
  return { success: true, message: "อ่านทั้งหมดแล้ว" };
}
