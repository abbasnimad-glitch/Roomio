"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";

export interface ActionResult {
  success: boolean;
  message: string;
}

async function requireProvider() {
  return requireRole(["service_provider", "admin"], "เฉพาะผู้ให้บริการเท่านั้นที่ทำรายการนี้ได้");
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const suffix = Date.now().toString(36).slice(-6);
  return `${base || "provider"}-${suffix}`;
}

function readProviderFields(formData: FormData) {
  const workingDistricts = formData
    .getAll("working_districts")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));

  let businessHours: Record<string, { open: string; close: string } | null> = {};
  const rawHours = formData.get("business_hours");
  if (typeof rawHours === "string" && rawHours.trim()) {
    try {
      const parsed = JSON.parse(rawHours);
      if (parsed && typeof parsed === "object") businessHours = parsed;
    } catch {
      businessHours = {};
    }
  }

  return {
    business_name: String(formData.get("business_name") ?? "").trim(),
    category_id: Number(formData.get("category_id") ?? 0),
    description: String(formData.get("description") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    line_id: String(formData.get("line_id") ?? "").trim() || null,
    working_districts: workingDistricts,
    lat: formData.get("lat") ? Number(formData.get("lat")) : null,
    lng: formData.get("lng") ? Number(formData.get("lng")) : null,
    business_hours: businessHours,
  };
}

function validateProviderFields(fields: ReturnType<typeof readProviderFields>): string | null {
  if (!fields.business_name) return "กรุณากรอกชื่อร้าน/ผู้ให้บริการ";
  if (!fields.category_id || fields.category_id <= 0) return "กรุณาเลือกหมวดหมู่บริการ";
  if (!fields.phone) return "กรุณากรอกเบอร์โทรศัพท์";
  if (fields.working_districts.length === 0) return "กรุณาเลือกอำเภอที่ให้บริการอย่างน้อย 1 แห่ง";
  return null;
}

export async function createServiceProvider(formData: FormData): Promise<ActionResult & { providerId?: string }> {
  const gate = await requireProvider();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const fields = readProviderFields(formData);
  const validationError = validateProviderFields(fields);
  if (validationError) return { success: false, message: validationError };

  const { data, error } = await gate.supabase
    .from("service_providers")
    .insert({
      ...fields,
      owner_id: gate.user.id,
      slug: slugify(fields.business_name),
      // status is intentionally omitted — it always defaults to 'pending'.
      // Providers cannot self-approve; a DB trigger also blocks it even if sent.
    })
    .select("id")
    .single();

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/provider");
  return { success: true, message: "เพิ่มประกาศเรียบร้อยแล้ว รอแอดมินตรวจสอบ", providerId: data.id };
}

export async function updateServiceProvider(providerId: string, formData: FormData): Promise<ActionResult> {
  const gate = await requireProvider();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const fields = readProviderFields(formData);
  const validationError = validateProviderFields(fields);
  if (validationError) return { success: false, message: validationError };

  const { error } = await gate.supabase
    .from("service_providers")
    .update(fields) // status/owner_id/slug are never included, so they can't be changed here
    .eq("id", providerId)
    .eq("owner_id", gate.user.id);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/provider");
  revalidatePath(`/dashboard/provider/${providerId}/edit`);
  return { success: true, message: "บันทึกการแก้ไขเรียบร้อยแล้ว" };
}

export async function deleteServiceProvider(providerId: string): Promise<ActionResult> {
  const gate = await requireProvider();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("service_providers")
    .delete()
    .eq("id", providerId)
    .eq("owner_id", gate.user.id);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/provider");
  return { success: true, message: "ลบประกาศเรียบร้อยแล้ว" };
}

export async function setServiceProviderAvailability(providerId: string, isAvailable: boolean): Promise<ActionResult> {
  const gate = await requireProvider();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("service_providers")
    .update({ is_available: isAvailable })
    .eq("id", providerId)
    .eq("owner_id", gate.user.id);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/provider");
  return { success: true, message: "อัปเดตสถานะพร้อมให้บริการแล้ว" };
}
