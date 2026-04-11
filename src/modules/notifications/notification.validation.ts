import { z } from "zod";

import { NOTIFICATION_TYPES } from "./notification.model";

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  category: z.enum(["all", "replies"]).optional().default("all"),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  isRead: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;

export const notificationIdParamSchema = z.object({
  id: z.string().length(24, "Invalid notification id"),
});
