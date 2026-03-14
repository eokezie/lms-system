import { z } from "zod";

export const createCategorySchema = z.object({
  label: z.string().min(1).max(50).trim(),
});

export const getCategoriesQuerySchema = z.object({
  publishedOnly: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === true || v === "true"),
});
