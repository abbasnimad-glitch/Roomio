"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function adminUpdateProfile(targetId: string, formData: FormData): Promise<ActionResult> {
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

  // The RPC itself re-checks is_admin() server-side and rejects non-admins —
  // this isn't just a UI-level guard, a non-admin calling this directly
  // would get a Postgres exception, not a silent no-op.
  const { error } = await supabase.rpc("admin_update_profile", {
    target_id: targetId,
    new_full_name: full_name,
    new_phone: phone,
    new_line_id: line_id,
    new_facebook_url: facebook_url,
    new_instagram_url: instagram_url,
  });

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath(`/profile/${targetId}`);
  return { success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว" };
}
