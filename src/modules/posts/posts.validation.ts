import { z } from "zod";

export const getPaginatedPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  topicStatus: z.enum(["all", "active", "suspended"]).optional(),
  search: z.string().trim().optional(),
  sort: z.enum(["most_recent", "oldest"]).optional().default("most_recent"),
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(50).trim(),
  topicId: z.string().min(1).max(50).trim(),
  authorId: z.string().min(1).max(50).trim(),
});
