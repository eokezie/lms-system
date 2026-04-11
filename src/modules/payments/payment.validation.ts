import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  courseId: z.string().length(24, "Invalid course ID"),
  /**
   * Two-letter billing country code (e.g. "NG" or "US") used
   * to decide which regional price & currency to use.
   */
  billingCountry: z.string().length(2).optional(),
});

export const paymentIdParamSchema = z.object({
  id: z.string().length(24, "Invalid payment ID"),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const paymentMethodIdParamSchema = z.object({
  paymentMethodId: z
    .string()
    .min(8, "Invalid payment method id")
    .max(120, "Invalid payment method id"),
});
