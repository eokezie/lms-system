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

/** NGN is zero-decimal in Stripe: amount is in Naira. */
export function formatAmountForStripe(amountNaira: number, currency: string): number {
  const zeroDecimal = ["ngn", "jpy", "krw"].includes(currency.toLowerCase());
  return zeroDecimal ? Math.round(amountNaira) : Math.round(amountNaira * 100);
}
