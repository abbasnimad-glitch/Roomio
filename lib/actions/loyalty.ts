"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AwardPointsResult {
  success: boolean;
  message: string;
}

// Admin-only: award loyalty points to a member found by phone number.
// RLS also enforces admin-only insert on loyalty_transactions, so this is defense in depth,
// not the only guard — but checking here first gives a clean error message instead of a
// generic Postgres permission-denied error.
export async function awardLoyaltyPoints(formData: FormData): Promise<AwardPointsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (myProfile?.role !== "admin") {
    return { success: false, message: "เฉพาะแอดมินเท่านั้นที่เพิ่มแต้มได้" };
  }

  const phone = String(formData.get("phone") ?? "").replace(/[^0-9]/g, "");
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "ใช้บริการ").trim() || "ใช้บริการ";

  if (phone.length < 9) return { success: false, message: "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง" };
  if (!amount || amount <= 0) return { success: false, message: "กรุณากรอกยอดเงินที่ถูกต้อง" };

  const { data: member } = await supabase.from("profiles").select("id, full_name").eq("phone", phone).maybeSingle();
  if (!member) return { success: false, message: `ไม่พบสมาชิกที่ใช้เบอร์ ${phone}` };

  const points = Math.round(amount); // 1 บาท = 1 แต้ม, ปรับอัตราได้ที่นี่

  const { error } = await supabase.from("loyalty_transactions").insert({
    user_id: member.id,
    points,
    note,
    created_by: user.id,
  });

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/admin/loyalty");
  revalidatePath("/profile");
  return { success: true, message: `เพิ่ม ${points} แต้มให้ ${member.full_name} สำเร็จ` };
}
