"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";

export interface ActionResult {
  success: boolean;
  message: string;
}

async function requireAdmin() {
  return requireRole(["admin"], "เฉพาะแอดมินเท่านั้นที่ทำรายการนี้ได้");
}

export async function createServiceCategory(formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const key = String(formData.get("key") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  const name_th = String(formData.get("name_th") ?? "").trim();
  const name_en = String(formData.get("name_en") ?? "").trim();
  const icon = String(formData.get("icon") ?? "Wrench").trim();

  if (!key || !name_th || !name_en) return { success: false, message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };

  const { data: maxSortRow } = await gate.supabase
    .from("service_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = (maxSortRow?.sort_order ?? 0) + 1;

  const { error } = await gate.supabase
    .from("service_categories")
    .insert({ key, name_th, name_en, icon, sort_order: nextSort });

  if (error) {
    if (error.code === "23505") return { success: false, message: "มีหมวดหมู่ที่ใช้รหัสนี้อยู่แล้ว ลองใช้ชื่ออื่น" };
    return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath("/dashboard/admin/categories");
  revalidatePath("/services");
  return { success: true, message: "เพิ่มหมวดหมู่เรียบร้อยแล้ว" };
}

export async function updateServiceCategory(categoryId: number, formData: FormData): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const name_th = String(formData.get("name_th") ?? "").trim();
  const name_en = String(formData.get("name_en") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();

  if (!name_th || !name_en) return { success: false, message: "กรุณากรอกชื่อหมวดหมู่ให้ครบทั้งไทยและอังกฤษ" };

  const { error } = await gate.supabase
    .from("service_categories")
    .update({ name_th, name_en, icon })
    .eq("id", categoryId);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/admin/categories");
  revalidatePath("/services");
  return { success: true, message: "บันทึกการแก้ไขแล้ว" };
}

export async function reorderServiceCategory(categoryId: number, direction: "up" | "down"): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { data: all } = await gate.supabase.from("service_categories").select("id, sort_order").order("sort_order");
  if (!all) return { success: false, message: "ไม่พบข้อมูลหมวดหมู่" };

  const idx = all.findIndex((c) => c.id === categoryId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= all.length) return { success: true, message: "" };

  const a = all[idx];
  const b = all[swapIdx];

  await gate.supabase.from("service_categories").update({ sort_order: b.sort_order }).eq("id", a.id);
  await gate.supabase.from("service_categories").update({ sort_order: a.sort_order }).eq("id", b.id);

  revalidatePath("/dashboard/admin/categories");
  revalidatePath("/services");
  return { success: true, message: "" };
}

export async function deleteServiceCategory(categoryId: number): Promise<ActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { error } = await gate.supabase.from("service_categories").delete().eq("id", categoryId);

  if (error) {
    // Postgres foreign key violation — a provider still references this category.
    if (error.code === "23503") {
      return { success: false, message: "ลบไม่ได้ เพราะยังมีประกาศผู้ให้บริการใช้หมวดหมู่นี้อยู่ ย้ายประกาศเหล่านั้นไปหมวดอื่นก่อน" };
    }
    return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };
  }

  revalidatePath("/dashboard/admin/categories");
  revalidatePath("/services");
  return { success: true, message: "ลบหมวดหมู่เรียบร้อยแล้ว" };
}
