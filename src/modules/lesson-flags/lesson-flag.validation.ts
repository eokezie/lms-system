import { z } from "zod";
import { LESSON_FLAG_REASONS } from "./lesson-flag.model";

const reasonEnum = z.enum(LESSON_FLAG_REASONS);

export const createLessonFlagSchema = z.object({
  courseId: z.string().length(24, "Invalid course id"),
  lessonId: z.string().length(24, "Invalid lesson id"),
  reason: reasonEnum,
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(8000, "Description is too long"),
});

export const listLessonFlagsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(["in_review", "reviewed", "all"]).optional().default("all"),
  search: z.string().trim().optional(),
  sort: z.enum(["most_recent", "oldest"]).optional().default("most_recent"),
});

export const lessonFlagIdParamSchema = z.object({
  id: z.string().length(24, "Invalid flag id"),
});

export const patchLessonFlagSchema = z
  .object({
    status: z.enum(["reviewed"]).optional(),
    adminNote: z.string().trim().max(8000).optional(),
  })
  .refine((d) => d.status !== undefined || d.adminNote !== undefined, {
    message: "Provide status and/or adminNote",
  });
