import mongoose, { FilterQuery } from "mongoose";
import { User, IUser } from "@/modules/users/user.model";
import { PlatformSettings, IPlatformSettings } from "./platform-settings.model";
import { UserActivityLog, IUserActivityLog } from "./activity-log.model";
import { AdminRole, IAdminRole } from "./admin-role.model";
import {
  defaultPermissionsForUserRole,
  superAdminMatrix,
  adminMatrix,
} from "./permissions.defaults";
import type { UserRole } from "@/modules/users/user.model";

export async function getOrCreatePlatformSettings(): Promise<IPlatformSettings> {
  let doc = await PlatformSettings.findOne({ key: "default" }).exec();
  if (!doc) {
    doc = await PlatformSettings.create({ key: "default" });
  }
  return doc;
}

export function updatePlatformSettings(
  patch: Partial<{
    courseSettings: IPlatformSettings["courseSettings"];
    instructorProfileDefaults: Record<string, unknown>;
  }>,
): Promise<IPlatformSettings | null> {
  return PlatformSettings.findOneAndUpdate(
    { key: "default" },
    { $set: patch },
    { new: true, upsert: true, runValidators: true },
  ).exec();
}

export function createActivityLog(entry: {
  actorId: string;
  subjectUserId?: string | null;
  actionLabel: string;
  detail: string;
}): Promise<IUserActivityLog> {
  return UserActivityLog.create({
    actorId: new mongoose.Types.ObjectId(entry.actorId),
    subjectUserId: entry.subjectUserId
      ? new mongoose.Types.ObjectId(entry.subjectUserId)
      : undefined,
    actionLabel: entry.actionLabel,
    detail: entry.detail,
  });
}

export async function findActivityForUser(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: IUserActivityLog[]; total: number }> {
  const uid = new mongoose.Types.ObjectId(userId);
  const filter = {
    $or: [{ actorId: uid }, { subjectUserId: uid }],
  };
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    UserActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorId", "firstName lastName email")
      .lean()
      .exec(),
    UserActivityLog.countDocuments(filter).exec(),
  ]);
  return { items: items as unknown as IUserActivityLog[], total };
}

export function findAdminRoleById(id: string): Promise<IAdminRole | null> {
  return AdminRole.findById(id).lean().exec() as Promise<IAdminRole | null>;
}

export function listAdminRoles(): Promise<IAdminRole[]> {
  return AdminRole.find()
    .sort({ builtIn: -1, name: 1 })
    .lean()
    .exec() as Promise<IAdminRole[]>;
}

export function createAdminRole(data: {
  name: string;
  description?: string;
  icon?: string;
  permissions: Record<string, unknown>;
}): Promise<IAdminRole> {
  return AdminRole.create({
    name: data.name,
    description: data.description,
    icon: data.icon,
    builtIn: false,
    permissions: data.permissions,
  });
}

export function updateAdminRolePermissions(
  id: string,
  permissions: Record<string, unknown>,
): Promise<IAdminRole | null> {
  return AdminRole.findByIdAndUpdate(
    id,
    { $set: { permissions } },
    { new: true, runValidators: true },
  ).exec();
}

export function deleteAdminRole(id: string): Promise<IAdminRole | null> {
  return AdminRole.findOneAndDelete({ _id: id, builtIn: false }).exec();
}

export async function ensureBuiltinRoles(): Promise<void> {
  const count = await AdminRole.countDocuments().exec();
  if (count > 0) return;
  await AdminRole.insertMany([
    {
      name: "Super Admin",
      description: "Full platform access",
      builtIn: true,
      permissions: superAdminMatrix(),
    },
    {
      name: "Admin",
      description: "Standard administrator",
      builtIn: true,
      permissions: adminMatrix(),
    },
  ]);
}

export function clearUsersWithAdminRole(roleId: string): Promise<unknown> {
  return User.updateMany(
    { adminRoleId: new mongoose.Types.ObjectId(roleId) },
    { $unset: { adminRoleId: 1 } },
  ).exec();
}

export function deleteUserById(userId: string): Promise<IUser | null> {
  return User.findByIdAndDelete(userId).exec();
}

const STAFF_ROLES: UserRole[] = ["instructor", "admin", "super_admin"];

export async function findStaffUsersPaginated(options: {
  page: number;
  limit: number;
  role?: string;
  search?: string;
}): Promise<{ users: IUser[]; total: number }> {
  const { page, limit, role, search } = options;
  const skip = (page - 1) * limit;
  const filter: FilterQuery<IUser> = {};
  if (role && STAFF_ROLES.includes(role as UserRole)) {
    filter.role = role as UserRole;
  } else {
    filter.role = { $in: STAFF_ROLES };
  }
  if (search?.trim()) {
    const rx = new RegExp(search.trim(), "i");
    filter.$or = [{ firstName: rx }, { lastName: rx }, { email: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .select(
        "firstName lastName email avatar role adminAccountStatus instructorAccountStatus createdAt updatedAt adminRoleId",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    User.countDocuments(filter).exec(),
  ]);
  return { users: users as unknown as IUser[], total };
}

export async function mergeEffectivePermissions(
  user: IUser,
): Promise<Record<string, { view?: boolean; edit?: boolean; manageTopics?: boolean }>> {
  const base = defaultPermissionsForUserRole(user.role);
  if (!user.adminRoleId) return base;
  const roleDoc = await AdminRole.findById(user.adminRoleId).lean().exec();
  if (!roleDoc?.permissions) return base;
  const merged = { ...base };
  for (const [k, v] of Object.entries(roleDoc.permissions as Record<string, unknown>)) {
    if (v && typeof v === "object") merged[k] = { ...merged[k], ...(v as object) };
  }
  return merged;
}
