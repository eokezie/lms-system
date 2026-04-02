import crypto from "crypto";
import { ApiError } from "@/utils/apiError";
import { logger } from "@/utils/logger";
import type { UserRole } from "@/modules/users/user.model";
import { User } from "@/modules/users/user.model";
import { createUser } from "@/modules/users/user.repository";
import { sendStaffInviteEmail } from "@/modules/auth/auth-email.service";
import {
  getOrCreatePlatformSettings,
  updatePlatformSettings,
  createActivityLog,
  findActivityForUser,
  findAdminRoleById,
  listAdminRoles,
  createAdminRole,
  updateAdminRolePermissions,
  deleteAdminRole,
  findStaffUsersPaginated,
  mergeEffectivePermissions,
  ensureBuiltinRoles,
  clearUsersWithAdminRole,
  deleteUserById,
} from "./admin-settings.repository";
import { PERMISSION_KEYS } from "./permissions.defaults";
import type { IPlatformSettings } from "./platform-settings.model";

function assertStaffManager(role: UserRole): void {
  if (role !== "admin" && role !== "super_admin") {
    throw ApiError.forbidden("Admin access required");
  }
}

function assertSuperAdmin(role: UserRole): void {
  if (role !== "super_admin") {
    throw ApiError.forbidden("Super admin access required");
  }
}

export async function getCourseSettingsService(): Promise<IPlatformSettings["courseSettings"]> {
  const doc = await getOrCreatePlatformSettings();
  return doc.courseSettings;
}

export async function patchCourseSettingsService(
  patch: Partial<IPlatformSettings["courseSettings"]>,
): Promise<IPlatformSettings> {
  const current = await getOrCreatePlatformSettings();
  const courseSettings = {
    ...current.courseSettings,
    ...patch,
  } as IPlatformSettings["courseSettings"];
  const doc = await updatePlatformSettings({ courseSettings });
  if (!doc) throw ApiError.internal("Failed to update settings");
  return doc;
}

export async function getInstructorProfileDefaultsService(): Promise<
  Record<string, unknown>
> {
  const doc = await getOrCreatePlatformSettings();
  return (doc.instructorProfileDefaults ?? {}) as Record<string, unknown>;
}

export async function patchInstructorProfileDefaultsService(
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const current = await getOrCreatePlatformSettings();
  const instructorProfileDefaults = {
    ...(current.instructorProfileDefaults as object),
    ...patch,
  };
  const doc = await updatePlatformSettings({ instructorProfileDefaults });
  if (!doc) throw ApiError.internal("Failed to update settings");
  return (doc.instructorProfileDefaults ?? {}) as Record<string, unknown>;
}

export async function listStaffUsersService(
  query: { page: number; limit: number; role?: string; search?: string },
  requesterRole: UserRole,
) {
  assertStaffManager(requesterRole);
  const { users, total } = await findStaffUsersPaginated(query);
  return {
    users,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function inviteUserService(
  dto: {
    email: string;
    firstName: string;
    lastName: string;
    role: "admin" | "instructor";
  },
  actorId: string,
  actorRole: UserRole,
) {
  assertStaffManager(actorRole);
  const exists = await User.exists({
    email: dto.email.toLowerCase(),
  }).exec();
  if (exists) throw ApiError.conflict("An account with this email already exists");

  const tempPassword =
    crypto.randomBytes(10).toString("base64url").slice(0, 12) + "Aa1";

  const user = await createUser({
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    password: tempPassword,
    role: dto.role,
  });

  await sendStaffInviteEmail({
    email: user.email,
    firstName: user.firstName,
    temporaryPassword: tempPassword,
    roleLabel: dto.role === "admin" ? "Admin" : "Instructor",
  });

  await createActivityLog({
    actorId,
    subjectUserId: user._id.toString(),
    actionLabel: "Invited user",
    detail: `${dto.firstName} ${dto.lastName} (${dto.email}) as ${dto.role}`,
  });

  logger.info({ userId: user._id, actorId }, "Staff user invited");
  return {
    userId: user._id.toString(),
    inviteSentAt: new Date().toISOString(),
  };
}

export async function updateStaffUserStatusService(
  targetUserId: string,
  status: "active" | "suspended",
  requesterId: string,
  requesterRole: UserRole,
) {
  assertStaffManager(requesterRole);
  if (targetUserId === requesterId) {
    throw ApiError.badRequest("You cannot change your own status here");
  }

  const target = await User.findById(targetUserId).exec();
  if (!target) throw ApiError.notFound("User not found");

  if (target.role === "super_admin" && requesterRole !== "super_admin") {
    throw ApiError.forbidden("Only a super admin can change this account");
  }

  if (target.role === "instructor") {
    target.instructorAccountStatus = status === "suspended" ? "suspended" : "verified";
  } else if (target.role === "admin" || target.role === "super_admin") {
    target.adminAccountStatus = status;
  } else {
    throw ApiError.badRequest("Suspension applies to staff accounts only");
  }
  await target.save();

  await createActivityLog({
    actorId: requesterId,
    subjectUserId: targetUserId,
    actionLabel: status === "suspended" ? "Suspended user" : "Reactivated user",
    detail: `${target.email}`,
  });

  return target;
}

export async function removeStaffUserService(
  targetUserId: string,
  requesterId: string,
  requesterRole: UserRole,
) {
  assertSuperAdmin(requesterRole);
  if (targetUserId === requesterId) {
    throw ApiError.badRequest("You cannot delete your own account");
  }

  const target = await User.findById(targetUserId).exec();
  if (!target) throw ApiError.notFound("User not found");

  if (target.role === "super_admin") {
    const superCount = await User.countDocuments({ role: "super_admin" }).exec();
    if (superCount <= 1) {
      throw ApiError.badRequest("Cannot remove the only super admin");
    }
  }

  if (!["instructor", "admin", "super_admin"].includes(target.role)) {
    throw ApiError.badRequest("This endpoint only removes staff accounts");
  }

  await deleteUserById(targetUserId);
  await createActivityLog({
    actorId: requesterId,
    actionLabel: "Removed user",
    detail: `${target.email} (${target.role})`,
  });
  return { deleted: true };
}

export async function getPermissionsForUserService(
  targetUserId: string,
  requesterRole: UserRole,
) {
  assertStaffManager(requesterRole);
  const user = await User.findById(targetUserId).exec();
  if (!user) throw ApiError.notFound("User not found");
  const effective = await mergeEffectivePermissions(user);
  return {
    userId: targetUserId,
    role: user.role,
    adminRoleId: user.adminRoleId?.toString(),
    effective,
    keys: PERMISSION_KEYS,
  };
}

export async function listRolesService(requesterRole: UserRole) {
  assertStaffManager(requesterRole);
  await ensureBuiltinRoles();
  return listAdminRoles();
}

export async function getRolePermissionsService(
  roleId: string,
  requesterRole: UserRole,
) {
  assertStaffManager(requesterRole);
  const role = await findAdminRoleById(roleId);
  if (!role) throw ApiError.notFound("Role not found");
  return {
    roleId,
    name: role.name,
    description: role.description,
    icon: role.icon,
    builtIn: role.builtIn,
    permissions: role.permissions ?? {},
    keys: PERMISSION_KEYS,
  };
}

export async function updateRolePermissionsService(
  roleId: string,
  permissions: Record<string, unknown>,
  requesterRole: UserRole,
) {
  assertSuperAdmin(requesterRole);
  const existing = await findAdminRoleById(roleId);
  if (!existing) throw ApiError.notFound("Role not found");
  if (existing.builtIn) {
    throw ApiError.badRequest("Built-in role permissions cannot be changed");
  }
  const updated = await updateAdminRolePermissions(roleId, permissions);
  if (!updated) throw ApiError.notFound("Role not found");
  return updated;
}

export async function createRoleService(
  body: {
    name: string;
    description?: string;
    icon?: string;
    permissions?: Record<string, unknown>;
  },
  requesterRole: UserRole,
) {
  assertSuperAdmin(requesterRole);
  return createAdminRole({
    name: body.name,
    description: body.description,
    icon: body.icon,
    permissions: (body.permissions ?? {}) as Record<string, unknown>,
  });
}

export async function deleteRoleService(roleId: string, requesterRole: UserRole) {
  assertSuperAdmin(requesterRole);
  const deleted = await deleteAdminRole(roleId);
  if (!deleted) throw ApiError.notFound("Role not found or cannot delete built-in role");
  await clearUsersWithAdminRole(roleId);
  return { deleted: true };
}

export async function getEffectivePermissionsForMeService(userId: string) {
  const user = await User.findById(userId).exec();
  if (!user) throw ApiError.notFound("User not found");
  const effective = await mergeEffectivePermissions(user);
  return {
    role: user.role,
    roleName:
      user.role === "super_admin"
        ? "Super Admin"
        : user.role === "admin"
          ? "Admin"
          : user.role === "instructor"
            ? "Instructor"
            : user.role,
    adminRoleId: user.adminRoleId?.toString(),
    effective,
    keys: PERMISSION_KEYS,
  };
}

export async function getMyActivityService(
  userId: string,
  query: { page: number; limit: number },
) {
  return findActivityForUser(userId, query.page, query.limit);
}

const DEFAULT_NOTIFICATION_PREFS = {
  courseUpdates: { email: true, app: true },
  replies: { email: true, app: true },
  accountUpdates: { email: true, app: true },
  systemAlerts: { email: true, app: true },
};

export async function updateNotificationPreferencesService(
  userId: string,
  patch: Record<string, { email?: boolean; app?: boolean }>,
) {
  const user = await User.findById(userId).exec();
  if (!user) throw ApiError.notFound("User not found");

  const cur = {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...(user.toObject().notificationPreferences as object),
  } as Record<string, { email: boolean; app: boolean }>;
  for (const [k, v] of Object.entries(patch)) {
    if (!v || !cur[k]) continue;
    cur[k] = {
      email: v.email ?? cur[k].email,
      app: v.app ?? cur[k].app,
    };
  }
  user.set("notificationPreferences", cur);
  await user.save();
  return user.notificationPreferences;
}

export { createActivityLog as logStaffActivity } from "./admin-settings.repository";
