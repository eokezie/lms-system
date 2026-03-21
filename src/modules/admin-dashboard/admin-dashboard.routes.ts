import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  getAdminDashboardSummaryHandler,
  getAdminDashboardChartHandler,
  getAdminDashboardTopCoursesHandler,
} from "./admin-dashboard.controller";
import {
  dashboardChartQuerySchema,
  topCoursesQuerySchema,
} from "@/modules/admin-dashboard/admin-dashboard.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/summary",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  getAdminDashboardSummaryHandler,
);

router.get(
  "/chart",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(dashboardChartQuerySchema, "query"),
  getAdminDashboardChartHandler,
);

router.get(
  "/top-courses",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(topCoursesQuerySchema, "query"),
  getAdminDashboardTopCoursesHandler,
);

export default router;
