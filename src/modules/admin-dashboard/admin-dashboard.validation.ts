import { z } from "zod";

export const dashboardChartQuerySchema = z.object({
  metric: z.enum([
    "signups",
    "revenue",
    "course_sales",
    "course_completions",
    "active_students",
    "abandoned_checkout",
  ]),
  /** ISO date or `YYYY-MM-DD` (UTC). */
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  interval: z.enum(["daily", "monthly", "yearly"]),
});
