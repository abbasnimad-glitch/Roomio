"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import type { UserRole } from "@/types/database";

async function requireAdmin() {
  return requireRole(["admin"], "เฉพาะแอดมินเท่านั้นที่ทำรายการนี้ได้");
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export async function setPropertyStatus(propertyId: string, status: "approved" | "rejected"): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("properties").update({ status }).eq("id", propertyId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/listings");
  return { success: true, message: status === "approved" ? "อนุมัติประกาศแล้ว" : "ปฏิเสธประกาศแล้ว" };
}

export async function setServiceProviderStatus(
  providerId: string,
  status: "approved" | "rejected"
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("service_providers").update({ status }).eq("id", providerId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/listings");
  return { success: true, message: status === "approved" ? "อนุมัติผู้ให้บริการแล้ว" : "ปฏิเสธผู้ให้บริการแล้ว" };
}

// ------------------------------------------------------------
// Admin delete — unlike deleteProperty/deleteServiceProvider in
// owner.ts/provider.ts, these are NOT filtered by owner_id, so an
// admin can remove any listing regardless of who owns it. Gated by
// requireAdmin() only.
// ------------------------------------------------------------
export async function deletePropertyAsAdmin(propertyId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("properties").delete().eq("id", propertyId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/listings");
  return { success: true, message: "ลบประกาศที่พักเรียบร้อยแล้ว" };
}

export async function deleteServiceProviderAsAdmin(providerId: string): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("service_providers").delete().eq("id", providerId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/listings");
  return { success: true, message: "ลบประกาศผู้ให้บริการเรียบร้อยแล้ว" };
}

export async function setUserRole(userId: string, role: UserRole): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/users");
  return { success: true, message: "อัปเดตสิทธิ์ผู้ใช้แล้ว" };
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { data: target } = await gate.supabase.from("profiles").select("role").eq("id", userId).single();
  if (target?.role === "admin") {
    return { success: false, message: "ไม่สามารถระงับบัญชีแอดมินได้" };
  }

  const { error } = await gate.supabase.from("profiles").update({ is_suspended: suspended }).eq("id", userId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/users");
  return { success: true, message: suspended ? "ระงับบัญชีผู้ใช้แล้ว" : "ยกเลิกการระงับบัญชีแล้ว" };
}

export async function setProfileVerified(userId: string, isVerified: boolean): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("profiles").update({ is_verified: isVerified }).eq("id", userId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/users");
  return { success: true, message: isVerified ? "ยืนยันตัวตนแล้ว" : "ยกเลิกการยืนยันตัวตนแล้ว" };
}

export async function setPropertyVerified(propertyId: string, isVerified: boolean): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("properties").update({ is_verified: isVerified }).eq("id", propertyId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/verification");
  return { success: true, message: isVerified ? "ยืนยันที่พักแล้ว" : "ยกเลิกการยืนยันที่พักแล้ว" };
}

export async function setPropertyFeatured(
  propertyId: string,
  isFeatured: boolean,
  featuredUntil: string | null
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("properties")
    .update({ is_featured: isFeatured, featured_until: featuredUntil })
    .eq("id", propertyId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/featured");
  return { success: true, message: isFeatured ? "ตั้งเป็นประกาศแนะนำแล้ว" : "ยกเลิกประกาศแนะนำแล้ว" };
}

export async function setServiceProviderFeatured(
  providerId: string,
  isFeatured: boolean,
  featuredUntil: string | null
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("service_providers")
    .update({ is_featured: isFeatured, featured_until: featuredUntil })
    .eq("id", providerId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/featured");
  return { success: true, message: isFeatured ? "ตั้งเป็นผู้ให้บริการแนะนำแล้ว" : "ยกเลิกผู้ให้บริการแนะนำแล้ว" };
}

export async function setPropertyBoost(
  propertyId: string,
  isBoosted: boolean,
  boostStartAt: string | null,
  boostEndAt: string | null
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("properties")
    .update({ is_boosted: isBoosted, boost_start_at: boostStartAt, boost_end_at: boostEndAt })
    .eq("id", propertyId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/boost");
  return { success: true, message: isBoosted ? "ตั้งค่าดันประกาศแล้ว" : "ยกเลิกการดันประกาศแล้ว" };
}

export async function setServiceProviderBoost(
  providerId: string,
  isBoosted: boolean,
  boostStartAt: string | null,
  boostEndAt: string | null
): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("service_providers")
    .update({ is_boosted: isBoosted, boost_start_at: boostStartAt, boost_end_at: boostEndAt })
    .eq("id", providerId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/admin/boost");
  return { success: true, message: isBoosted ? "ตั้งค่าดันประกาศแล้ว" : "ยกเลิกการดันประกาศแล้ว" };
}
