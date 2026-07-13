import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";
import { BOOST_PLAN } from "@/lib/constants";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  // Basic CSRF guard: a legitimate same-origin fetch() POST from the
  // browser always sends an Origin header matching this site. A forged
  // cross-origin request either sends a different Origin or none at all —
  // both fail this check and are rejected before any auth/DB work happens.
  const origin = request.headers.get("origin");
  if (origin !== SITE_URL) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paymentId = body?.payment_id as string | undefined;
  const propertyId = body?.property_id as string | undefined;
  if (!paymentId || !propertyId) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
  }

  const { data: payment } = await supabase
    .from("boost_payments")
    .select("*, property:properties(name)")
    .eq("id", paymentId)
    .single();

  if (!payment || payment.user_id !== user.id || payment.property_id !== propertyId) {
    return NextResponse.json({ error: "ไม่พบข้อมูลการชำระเงิน" }, { status: 404 });
  }
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "รายการนี้ดำเนินการแล้ว" }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch {
    return NextResponse.json({ error: "ระบบชำระเงินยังไม่ได้ตั้งค่า" }, { status: 503 });
  }

  // Reuse an existing Stripe session instead of creating a duplicate — e.g.
  // the owner double-clicked "Pay with Stripe", or navigated back and
  // clicked it again while a session from moments ago is still valid.
  if (payment.status === "pending" && payment.stripe_session_id) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
      if (existingSession.status === "open" && existingSession.url) {
        return NextResponse.json({ url: existingSession.url });
      }
      // Session is expired/completed/otherwise unusable — fall through to create a fresh one.
    } catch {
      // Couldn't retrieve the old session (e.g. invalid id) — fall through to create a fresh one.
    }
  }

  // Amount always comes from the trusted DB record (BOOST_PLAN.priceTHB at
  // creation time), never from the request — Stripe wants THB in satang.
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "thb",
            unit_amount: Math.round(Number(payment.amount) * 100),
            product_data: {
              name: `ดันประกาศ ${BOOST_PLAN.days} วัน — ${payment.property?.name ?? "ที่พัก"}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { payment_id: paymentId, property_id: propertyId },
      success_url: `${SITE_URL}/dashboard/owner/boost/${paymentId}/success`,
      cancel_url: `${SITE_URL}/dashboard/owner/boost/${paymentId}`,
    });
  } catch {
    return NextResponse.json({ success: false, error: "payment_unavailable" }, { status: 502 });
  }

  // Guard against overwriting a session_id a concurrent request may have
  // just written: only update if the row's stripe_session_id still matches
  // what we read at the top of this request (null, or the stale one we
  // just determined was unusable).
  let updateQuery = supabase.from("boost_payments").update({ stripe_session_id: session.id }).eq("id", paymentId);
  updateQuery = payment.stripe_session_id
    ? updateQuery.eq("stripe_session_id", payment.stripe_session_id)
    : updateQuery.is("stripe_session_id", null);
  await updateQuery;

  return NextResponse.json({ url: session.url });
}
