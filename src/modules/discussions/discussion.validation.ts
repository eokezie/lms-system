import { z } from "zod";

export const listDiscussionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  lessonId: z.string().length(24).optional(),
  sort: z.enum(["most_recent", "oldest"]).optional().default("most_recent"),
});

export const createDiscussionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1),
  lessonId: z.string().length(24).optional().nullable(),
});

export const discussionCourseParamsSchema = z.object({
  id: z.string().length(24),
});

export const discussionThreadParamsSchema = z.object({
  id: z.string().length(24),
  threadId: z.string().length(24),
});

export const createReplySchema = z.object({
  body: z.string().trim().min(1),
});

export const threadRepliesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
