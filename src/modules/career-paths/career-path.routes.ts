import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { processFiles } from "@/middleware/multer.middleware";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  exploreCareerPathsHandler,
  listCareerPathsAdminHandler,
  getCareerPathStatsHandler,
  getCareerPathByIdHandler,
  createCareerPathHandler,
  updateCareerPathHandler,
  deleteCareerPathHandler,
  enrollCareerPathHandler,
  dropCareerPathEnrollmentHandler,
  completeCareerPathEnrollmentHandler,
} from "./career-path.controller";
import {
  createCareerPathSchema,
  updateCareerPathSchema,
  careerPathIdParamSchema,
  listCareerPathsQuerySchema,
  exploreCareerPathsQuerySchema,
} from "./career-path.validation";

const router = Router();

router.use(authenticate);

/** Admin dashboard: totals + most enrolled path */
router.get(
  "/stats",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  getCareerPathStatsHandler,
);

/** Students: published career paths only */
router.get(
  "/explore",
  validate(exploreCareerPathsQuerySchema, "query"),
  authorize(USER_ROLES[0]),
  exploreCareerPathsHandler,
);

/** Admin / instructor: manage list */
router.get(
  "/",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(listCareerPathsQuerySchema, "query"),
  listCareerPathsAdminHandler,
);

/** Students: enroll / leave / mark completed (for stats & UX) */
router.post(
  "/:id/enroll",
  authorize(USER_ROLES[0]),
  validate(careerPathIdParamSchema, "params"),
  enrollCareerPathHandler,
);

router.delete(
  "/:id/enroll",
  authorize(USER_ROLES[0]),
  validate(careerPathIdParamSchema, "params"),
  dropCareerPathEnrollmentHandler,
);

router.post(
  "/:id/complete",
  authorize(USER_ROLES[0]),
  validate(careerPathIdParamSchema, "params"),
  completeCareerPathEnrollmentHandler,
);

/** Any authenticated user: detail (students only see published — enforced in service) */
router.get(
  "/:id",
  validate(careerPathIdParamSchema, "params"),
  authorize(USER_ROLES[0], USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  getCareerPathByIdHandler,
);

router.post(
  "/",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  processFiles as any,
  validate(createCareerPathSchema),
  createCareerPathHandler,
);

router.patch(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(careerPathIdParamSchema, "params"),
  processFiles as any,
  validate(updateCareerPathSchema),
  updateCareerPathHandler,
);

router.delete(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(careerPathIdParamSchema, "params"),
  deleteCareerPathHandler,
);

export default router;
