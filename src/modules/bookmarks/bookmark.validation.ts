import { z } from "zod";

export const courseBookmarkParamSchema = z.object({
  courseId: z.string().length(24, "Invalid course id"),
});

export const listBookmarksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  courseType: z.enum(["all", "free", "paid"]).optional().default("all"),
  sort: z.enum(["newest", "oldest", "title_asc"]).optional().default("newest"),
});

export type ListBookmarksQuery = z.infer<typeof listBookmarksQuerySchema>;
