import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  staffUsersQuerySchema,
  inviteUserSchema,
  staffUserStatusSchema,
  courseSettingsPatchSchema,
  instructorDefaultsPatchSchema,
  createRoleSchema,
  updateRolePermissionsSchema,
  userIdParamSchema,
  roleIdParamSchema,
} from "./admin-settings.validation";
import {
  getCourseSettingsHandler,
  patchCourseSettingsHandler,
  getInstructorDefaultsHandler,
  patchInstructorDefaultsHandler,
  listStaffUsersHandler,
  inviteStaffUserHandler,
  getStaffUserPermissionsHandler,
  patchStaffUserStatusHandler,
  deleteStaffUserHandler,
  listRolesHandler,
  getRolePermissionsHandler,
  patchRolePermissionsHandler,
  createRoleHandler,
  deleteRoleHandler,
} from "./admin-settings.controller";

const router = Router();

router.use(authenticate);
router.use(authorize(USER_ROLES[2], USER_ROLES[3]));

router.get("/settings/course", getCourseSettingsHandler);
router.patch(
  "/settings/course",
  validate(courseSettingsPatchSchema),
  patchCourseSettingsHandler,
);
router.get("/settings/instructor-profile-defaults", getInstructorDefaultsHandler);
router.patch(
  "/settings/instructor-profile-defaults",
  validate(instructorDefaultsPatchSchema),
  patchInstructorDefaultsHandler,
);

router.get(
  "/users",
  validate(staffUsersQuerySchema, "query"),
  listStaffUsersHandler,
);
router.post("/users/invite", validate(inviteUserSchema), inviteStaffUserHandler);
router.get(
  "/users/:id/permissions",
  validate(userIdParamSchema, "params"),
  getStaffUserPermissionsHandler,
);
router.patch(
  "/users/:id/status",
  validate(userIdParamSchema, "params"),
  validate(staffUserStatusSchema),
  patchStaffUserStatusHandler,
);
router.delete(
  "/users/:id",
  authorize(USER_ROLES[3]),
  validate(userIdParamSchema, "params"),
  deleteStaffUserHandler,
);

router.get("/roles", listRolesHandler);
router.post("/roles", authorize(USER_ROLES[3]), validate(createRoleSchema), createRoleHandler);
router.get(
  "/roles/:id/permissions",
  validate(roleIdParamSchema, "params"),
  getRolePermissionsHandler,
);
router.patch(
  "/roles/:id/permissions",
  authorize(USER_ROLES[3]),
  validate(roleIdParamSchema, "params"),
  validate(updateRolePermissionsSchema),
  patchRolePermissionsHandler,
);
router.delete(
  "/roles/:id",
  authorize(USER_ROLES[3]),
  validate(roleIdParamSchema, "params"),
  deleteRoleHandler,
);

export default router;
