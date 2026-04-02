import { z } from "zod";

const channelPrefsSchema = z.object({
  email: z.boolean().optional(),
  app: z.boolean().optional(),
});

export const notificationPreferencesPatchSchema = z.object({
  courseUpdates: channelPrefsSchema.optional(),
  replies: channelPrefsSchema.optional(),
  accountUpdates: channelPrefsSchema.optional(),
  systemAlerts: channelPrefsSchema.optional(),
});

export const staffUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  role: z.enum(["instructor", "admin", "super_admin"]).optional(),
  search: z.string().trim().optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  role: z.enum(["admin", "instructor"]),
});

export const staffUserStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
});

export const courseSettingsPatchSchema = z.object({
  quizPassMarkPercent: z.coerce.number().min(0).max(100).optional(),
  discountLimitType: z.enum(["any", "specific", "none"]).optional(),
  discountLimitAmount: z.coerce.number().min(0).nullable().optional(),
  maxDiscountPercent: z.coerce.number().min(0).max(100).optional(),
});

export const instructorDefaultsPatchSchema = z.record(z.string(), z.unknown());

export const createRoleSchema = z.object({
  name: z.string().min(1).max(120).trim(),
  description: z.string().max(500).trim().optional(),
  icon: z.string().max(64).trim().optional(),
  permissions: z.record(z.unknown()).optional(),
});

export const updateRolePermissionsSchema = z.object({
  permissions: z.record(z.unknown()),
});

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const userIdParamSchema = z.object({
  id: z.string().length(24),
});

export const roleIdParamSchema = z.object({
  id: z.string().length(24),
});
