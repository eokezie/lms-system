import { z } from "zod";

export const updateLessonProgressSchema = z.object({
  status: z.enum(["started", "completed"]),
  percent: z.number().min(0).max(100).optional(),
});
