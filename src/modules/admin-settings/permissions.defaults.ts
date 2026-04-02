import type { PermissionFlags } from "./admin-role.model";
import type { UserRole } from "@/modules/users/user.model";

/** Stable keys for RBAC matrix (admin UI rows). */
export const PERMISSION_KEYS = [
  "home.access",
  "course-management.courses",
  "course-management.submissions",
  "course-management.discounts",
  "students.access",
  "instructor-management.access",
  "community-forum.access",
  "community-forum.manageTopics",
  "payments.access",
  "announcements.access",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

function all(
  flags: Partial<PermissionFlags>,
): Record<string, PermissionFlags> {
  const out: Record<string, PermissionFlags> = {};
  for (const k of PERMISSION_KEYS) {
    out[k] = { ...flags };
  }
  return out;
}

export function superAdminMatrix(): Record<string, PermissionFlags> {
  return all({ view: true, edit: true, manageTopics: true });
}

export function adminMatrix(): Record<string, PermissionFlags> {
  return all({ view: true, edit: true, manageTopics: false });
}

function instructorStaffMatrix(): Record<string, PermissionFlags> {
  const out: Record<string, PermissionFlags> = {};
  for (const k of PERMISSION_KEYS) {
    out[k] = {
      view: k.startsWith("course-management") || k === "home.access",
      edit: k === "course-management.courses" || k === "course-management.discounts",
    };
  }
  out["community-forum.manageTopics"] = { view: false, edit: false };
  return out;
}

/** Effective permissions when user has no AdminRole document. */
export function defaultPermissionsForUserRole(
  role: UserRole,
): Record<string, PermissionFlags> {
  if (role === "super_admin") return superAdminMatrix();
  if (role === "admin") return adminMatrix();
  if (role === "instructor") return instructorStaffMatrix();
  return {};
}
