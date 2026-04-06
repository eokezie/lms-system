import { z } from "zod";

export const courseAdvisorySchema = z.object({
  answers: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .min(1, "At least one answer is required")
    .max(15),
});

export type CourseAdvisoryInput = z.infer<typeof courseAdvisorySchema>;
