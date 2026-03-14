import { z } from "zod";

export const createRatingSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5),
  reviewText: z.string().max(2000).trim().optional(),
});

export const updateRatingSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    reviewText: z.string().max(2000).trim().optional(),
  })
  .refine(
    (data) => data.rating !== undefined || data.reviewText !== undefined,
    {
      message: "At least one of rating or reviewText must be provided",
    },
  );

/** Course id or slug (for consistency with single course endpoint). */
export const courseIdOrSlugParamSchema = z.object({
  id: z.string().min(1, "Course id or slug required").max(200),
});

export const ratingIdParamSchema = z.object({
  ratingId: z.string().length(24, "Invalid rating ID"),
});

export const getRatingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});
