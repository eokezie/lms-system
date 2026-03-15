import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  courseId: z.string().length(24, "Invalid course ID"),
});

export const paymentIdParamSchema = z.object({
  id: z.string().length(24, "Invalid payment ID"),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
