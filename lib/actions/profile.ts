"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function updateMyProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const line_id = String(formData.get("line_id") ?? "").trim() || null;
  const facebook_url = String(formData.get("facebook_url") ?? "").trim() || null;
  const instagram_url = String(formData.get("instagram_url") ?? "").trim() || null;

  if (!full_name) return { success: false, message: "กรุณากรอกชื่อ-นามสกุล" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone, line_id, facebook_url, instagram_url })
    .eq("id", user.id);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/profile");
  return { success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว" };
}

export async function updateMyAvatar(avatarPath: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const { error } = await supabase.from("profiles").update({ avatar_url: avatarPath }).eq("id", user.id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/profile");
  return { success: true, message: "อัปเดตรูปโปรไฟล์แล้ว" };
}
