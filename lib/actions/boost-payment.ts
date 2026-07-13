"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/actions/auth-helpers";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getStripeClient } from "@/lib/stripe";
import { trackEvent } from "@/lib/actions/analytics";
import { BOOST_PLAN } from "@/lib/constants";

export interface BoostPaymentActionResult {
  success: boolean;
  message: string;
  paymentId?: string;
  reason?: string;
}

async function requireOwner() {
  return requireRole(["owner", "admin"], "เฉพาะเจ้าของที่พักเท่านั้นที่ทำรายการนี้ได้");
}

async function requireAdmin() {
  return requireRole(["admin"], "เฉพาะแอดมินเท่านั้นที่ทำรายการนี้ได้");
}

// Step 1 — owner clicks "Boost": create a pending payment instead of
// boosting directly.
export async function createBoostPayment(propertyId: string): Promise<BoostPaymentActionResult> {
  const gate = await requireOwner();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const { data: property } = await gate.supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .single();
  if (!property || property.owner_id !== gate.user.id) {
    return { success: false, message: "คุณไม่มีสิทธิ์ดันประกาศนี้" };
  }

  // Reuse an existing pending payment for this property instead of creating a duplicate.
  const { data: existingPending } = await gate.supabase
    .from("boost_payments")
    .select("id")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .maybeSingle();
  if (existingPending) {
    return { success: true, message: "มีรายการชำระเงินค้างอยู่แล้ว", paymentId: existingPending.id };
  }

  const { data, error } = await gate.supabase
    .from("boost_payments")
    .insert({ user_id: gate.user.id, property_id: propertyId, amount: BOOST_PLAN.priceTHB })
    .select("id")
    .single();
  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  revalidatePath("/dashboard/owner");
  return { success: true, message: "สร้างรายการชำระเงินแล้ว", paymentId: data.id };
}

// Step 2 — owner picks Stripe or PromptPay on the payment step page.
export async function selectBoostPaymentMethod(
  paymentId: string,
  method: "stripe" | "promptpay"
): Promise<BoostPaymentActionResult> {
  const gate = await requireOwner();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const { data: payment } = await gate.supabase.from("boost_payments").select("*").eq("id", paymentId).single();
  if (!payment || payment.user_id !== gate.user.id) return { success: false, message: "ไม่พบข้อมูลการชำระเงิน" };
  if (payment.status !== "pending") return { success: false, message: "รายการนี้ดำเนินการแล้ว" };

  const { error } = await gate.supabase.from("boost_payments").update({ payment_method: method }).eq("id", paymentId);
  if (error) return { success: false, message: error.message };

  return { success: true, message: "เลือกช่องทางชำระเงินแล้ว", paymentId };
}

// Step 5 — called from the Stripe success redirect. Verifies the Checkout
// Session directly with Stripe's API before activating anything — never
// trusts the mere fact that the browser landed on the success URL.
export async function confirmBoostPayment(paymentId: string): Promise<BoostPaymentActionResult> {
  const gate = await requireOwner();
  if (!gate.ok || !gate.user) return { success: false, message: gate.message };

  const { data: payment } = await gate.supabase.from("boost_payments").select("*").eq("id", paymentId).single();
  if (!payment || payment.user_id !== gate.user.id) return { success: false, message: "ไม่พบข้อมูลการชำระเงิน" };

  if (payment.status === "paid") {
    return { success: true, message: "ดันประกาศเรียบร้อยแล้ว", paymentId };
  }
  if (payment.payment_method !== "stripe" || !payment.stripe_session_id) {
    return { success: false, message: "ไม่พบข้อมูลการชำระเงินผ่าน Stripe" };
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch {
    return { success: false, message: "ระบบชำระเงินยังไม่ได้ตั้งค่า" };
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
  } catch {
    return { success: false, message: "ระบบชำระเงินขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง", reason: "stripe_error" };
  }
  if (session.payment_status !== "paid" || session.metadata?.payment_id !== paymentId) {
    return { success: false, message: "ยังไม่ได้รับการชำระเงิน" };
  }

  // Verified with Stripe directly — now safe to finalize using the
  // service-role client (see lib/supabase/service.ts for why this needs
  // elevated privileges rather than the owner's own session).
  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient.rpc("finalize_boost_payment_service", { target_payment_id: paymentId });
  if (error) return { success: false, message: `เกิดข้อผิดพลาด: ${error.message}` };

  trackEvent("payment_success", "property", payment.property_id, { method: "stripe", amount: payment.amount });

  revalidatePath("/dashboard/owner");
  return { success: true, message: "ชำระเงินสำเร็จ ดันประกาศเรียบร้อยแล้ว", paymentId };
}

// PromptPay path — admin manually confirms after checking the transfer.
export async function approveBoostPayment(paymentId: string): Promise<BoostPaymentActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return { success: false, message: gate.message };

  const { data: payment } = await gate.supabase.from("boost_payments").select("property_id, amount").eq("id", paymentId).single();

  const { error } = await gate.supabase.rpc("admin_approve_boost_payment", { target_payment_id: paymentId });
  if (error) return { success: false, message: error.message };

  if (payment) {
    trackEvent("payment_success", "property", payment.property_id, { method: "promptpay", amount: payment.amount });
  }

  revalidatePath("/dashboard/admin/boost-payments");
  return { success: true, message: "อนุมัติการชำระเงินและดันประกาศแล้ว" };
}
