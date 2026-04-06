import { z } from "zod";

export const createTopicsSchema = z.object({
  label: z.string().min(1).max(50).trim(),
});

export const updateTopicsSchema = z.object({
  label: z.string().min(1).max(50).trim(),
});

export const topicIdOrSlugParamSchema = z.object({
  id: z.string().min(1, "Topic id or slug required").max(200),
});
