import Stripe from "stripe";
import { env } from "@/config/env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

/**
 * Convert a major-unit amount (e.g. 2000 NGN, 10 USD)
 * into the minor units Stripe expects.
 *
 * NOTE: NGN is *not* zero-decimal in Stripe, so it must
 * be sent as kobo (amount * 100).
 */
export function formatAmountForStripe(amount: number, currency: string): number {
  const zeroDecimal = ["jpy", "krw"].includes(currency.toLowerCase());
  return zeroDecimal ? Math.round(amount) : Math.round(amount * 100);
}
