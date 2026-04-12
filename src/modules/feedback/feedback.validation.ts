import { z } from "zod";

import { FEEDBACK_STATUSES } from "./feedback.model";

export const createFeedbackSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Suggestion is required").max(5000),
});

export const feedbackIdParamSchema = z.object({
  id: z.string().length(24, "Invalid feedback id"),
});

export const listFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().max(120).optional(),
  status: z.enum([...FEEDBACK_STATUSES, "all"]).optional().default("all"),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});

export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>;

export const addNoteSchema = z.object({
  note: z.string().trim().min(1, "Note is required").max(2000),
});
