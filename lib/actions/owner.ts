"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import type { AvailabilityStatus, GenderPolicy, PropertyType, RoomType } from "@/types/database";

export interface ActionResult {
  success: boolean;
  message: string;
}

async function requireOwner() {
  return requireRole(["owner", "admin"], "เฉพาะเจ้าของที่พักเท่านั้นที่ทำรายการนี้ได้");
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
  return `${base || "property"}-${suffix}`;
}

function readPropertyFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    property_type: String(formData.get("property_type") ?? "dormitory") as PropertyType,
    description: String(formData.get("description") ?? "").trim(),
    district_id: Number(formData.get("district_id") ?? 0),
    nearby_university_id: formData.get("nearby_university_id")
      ? Number(formData.get("nearby_university_id"))
      : null,
    address: String(formData.get("address") ?? "").trim(),
    lat: Number(formData.get("lat") ?? 0),
    lng: Number(formData.get("lng") ?? 0),
    price_monthly: Number(formData.get("price_monthly") ?? 0),
    deposit: Number(formData.get("deposit") ?? 0),
    room_size_sqm: formData.get("room_size_sqm") ? Number(formData.get("room_size_sqm")) : null,
    room_type: String(formData.get("room_type") ?? "single") as RoomType,
    gender_policy: String(formData.get("gender_policy") ?? "any") as GenderPolicy,
    has_air_conditioner: formData.get("has_air_conditioner") === "true",
    has_furniture: formData.get("has_furniture") === "true",
    has_parking: formData.get("has_parking") === "true",
    has_wifi: formData.get("has_wifi") === "true",
    has_security: formData.get("has_security") === "true",
    has_laundry: formData.get("has_laundry") === "true",
  };
}

function validatePropertyFields(fields: ReturnType<typeof readPropertyFields>): string | null {
  if (!fields.name) return "กรุณากรอกชื่อที่พัก";
  if (!fields.address) return "กรุณากรอกที่อยู่";
  if (!fields.district_id) return "กรุณาเลือกอำเภอ";
  if (!fields.price_monthly || fields.price_monthly <= 0) return "กรุณากรอกราคาต่อเดือนให้ถูกต้อง";
  if (!fields.lat || !fields.lng) return "กรุณากรอกพิกัดละติจูด/ลองจิจูด";
  return null;
}

export async function createProperty(formData: FormData): Promise<ActionResult & { propertyId?: string; propertySlug?: string }> {
  const gate = await requireOwner();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const fields = readPropertyFields(formData);
  const validationError = validatePropertyFields(fields);
  if (validationError) return { success: false, message: validationError };

  const { data, error } = await gate.supabase
    .from("properties")
    .insert({
      ...fields,
      owner_id: gate.user.id,
      slug: slugify(fields.name),
      // status is intentionally omitted — it always defaults to 'pending'.
      // Owners cannot self-approve; a DB trigger also blocks it even if sent.
    })
    .select("id, slug")
    .single();

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/owner");
  return { success: true, message: "เพิ่มประกาศเรียบร้อยแล้ว รอแอดมินตรวจสอบ", propertyId: data.id, propertySlug: data.slug };
}

export async function updateProperty(propertyId: string, formData: FormData): Promise<ActionResult> {
  const gate = await requireOwner();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const fields = readPropertyFields(formData);
  const validationError = validatePropertyFields(fields);
  if (validationError) return { success: false, message: validationError };

  const { error } = await gate.supabase
    .from("properties")
    .update(fields) // status/owner_id/slug are never included, so they can't be changed here
    .eq("id", propertyId)
    .eq("owner_id", gate.user.id);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/owner");
  revalidatePath(`/dashboard/owner/${propertyId}/edit`);
  return { success: true, message: "บันทึกการแก้ไขเรียบร้อยแล้ว" };
}

export async function deleteProperty(propertyId: string): Promise<ActionResult> {
  const gate = await requireOwner();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("owner_id", gate.user.id);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/owner");
  return { success: true, message: "ลบประกาศเรียบร้อยแล้ว" };
}

export async function setPropertyAvailability(
  propertyId: string,
  availability: AvailabilityStatus
): Promise<ActionResult> {
  const gate = await requireOwner();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const { error } = await gate.supabase
    .from("properties")
    .update({ availability })
    .eq("id", propertyId)
    .eq("owner_id", gate.user.id);

  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/owner");
  return { success: true, message: "อัปเดตสถานะห้องว่างแล้ว" };
}
