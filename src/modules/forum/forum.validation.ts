import { z } from "zod";

export const postSortEnum = z.enum(["recent", "popular", "comments"]);
export const postStatusFilterEnum = z.enum(["flagged", "unflagged"]);
export const flagResolutionEnum = z.enum(["resolved", "dismissed"]);
export const forumAccessStatusEnum = z.enum([
  "active",
  "banned",
  "muted",
  "restricted",
]);

export const createPostSchema = z.object({
  topicId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid topic ID"),
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(10000),
});

export const editPostSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  sort: postSortEnum.optional().default("recent"),
  topic: z.string().trim().optional(),
  search: z.string().trim().optional(),
  authorId: z.string().trim().optional(),
  status: postStatusFilterEnum.optional(),
});

export const createReplySchema = z.object({
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string()).optional(),
});

export const editReplySchema = z.object({
  content: z.string().min(1).max(5000),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createTopicSchema = z.object({
  name: z.string().min(1).max(100),
});

export const editTopicSchema = z.object({
  name: z.string().min(1).max(100),
});

export const createNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const createFlagSchema = z.object({
  reason: z.string().min(1).max(200),
  explanation: z.string().min(1).max(1000),
});

export const resolveFlagSchema = z.object({
  status: flagResolutionEnum,
  actionTaken: z.string().max(500).optional(),
});

export const createGuidelineSchema = z.object({
  icon: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
});

export const editGuidelineSchema = z.object({
  icon: z.string().min(1).max(50).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
});

export const contributorsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const moderationLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  actorId: z.string().trim().optional(),
  actionType: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});

export const updateUserAccessSchema = z.object({
  status: forumAccessStatusEnum,
  reason: z.string().max(500).optional(),
  duration: z.string().max(100).optional(),
});
