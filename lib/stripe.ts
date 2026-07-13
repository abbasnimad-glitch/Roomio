import Stripe from "stripe";

// SERVER-ONLY. STRIPE_SECRET_KEY must never be a NEXT_PUBLIC_* var.
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(secretKey);
}
