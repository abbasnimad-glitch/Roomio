"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth-helpers";

export interface ReviewActionResult {
  success: boolean;
  message: string;
  reviewId?: string;
}

export async function submitReview(formData: FormData): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบก่อนรีวิว" };

  const propertyId = (formData.get("property_id") as string) || null;
  const serviceProviderId = (formData.get("service_provider_id") as string) || null;
  const rating = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  const revalidateTarget = formData.get("revalidate_path") as string | null;

  if (!propertyId && !serviceProviderId) return { success: false, message: "ไม่พบรายการที่จะรีวิว" };
  if (rating < 1 || rating > 5) return { success: false, message: "กรุณาให้คะแนน 1-5 ดาว" };

  const { data, error } = await supabase
    .from("reviews")
    .upsert(
      {
        author_id: user.id,
        property_id: propertyId,
        service_provider_id: serviceProviderId,
        rating,
        comment: comment || null,
      },
      { onConflict: propertyId ? "author_id,property_id" : "author_id,service_provider_id" }
    )
    .select("id")
    .single();

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  if (revalidateTarget) revalidatePath(revalidateTarget);
  return { success: true, message: "บันทึกรีวิวเรียบร้อยแล้ว", reviewId: data.id };
}

export async function deleteReview(reviewId: string, revalidateTarget?: string): Promise<ReviewActionResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { success: false, message: "กรุณาเข้าสู่ระบบ" };

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  if (revalidateTarget) revalidatePath(revalidateTarget);
  return { success: true, message: "ลบรีวิวแล้ว" };
}
