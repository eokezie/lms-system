import { z } from "zod";

export const createDiscountSchema = z.object({
  courseId: z.string().length(24).nullable().optional(),
  discountName: z.string().trim().min(1, "Discount name required").max(200),
  percentage: z.number().min(1).max(100),
  appliesTo: z.enum(["first_payments", "all_payments"]).default("all_payments"),
  expiresAt: z.coerce.date(),
  purchaseLimit: z.number().int().min(1).nullable().optional(),
  displayOnDashboard: z.boolean().optional().default(true),
});

export const updateDiscountSchema = z.object({
  discountName: z.string().trim().min(1).max(200).optional(),
  percentage: z.number().min(1).max(100).optional(),
  appliesTo: z.enum(["first_payments", "all_payments"]).optional(),
  expiresAt: z.coerce.date().optional(),
  purchaseLimit: z.number().int().min(1).nullable().optional(),
  displayOnDashboard: z.boolean().optional(),
});

export const discountIdParamSchema = z.object({
  id: z.string().length(24, "Invalid discount ID"),
});

export const listDiscountsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  courseId: z.string().length(24).optional(),
});

export const forCourseParamSchema = z.object({
  courseId: z.string().length(24, "Invalid course ID"),
});
