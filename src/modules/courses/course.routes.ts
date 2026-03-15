import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "../users/user.model";
import {
  createCourseHandler,
  getExploreCoursesHandler,
  getRelatedCoursesHandler,
  getSingleCourseHandler,
  updateCoursePriceHandler,
  getManageCoursesHandler,
  getCourseStatsHandler,
  updateCourseHandler,
  deleteCourseHandler,
} from "./course.controller";
import {
  createCourseSchema,
  getExploreCoursesQuerySchema,
  getManageCoursesQuerySchema,
  courseIdParamSchema,
  courseIdOrSlugParamSchema,
  getRelatedCoursesQuerySchema,
  updateCoursePriceSchema,
  updateCourseSchema,
} from "./course.validation";
import ratingRoutes from "../ratings/rating.routes";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(USER_ROLES[0]),
  validate(getExploreCoursesQuerySchema, "query"),
  getExploreCoursesHandler,
);
router.get(
  "/manage",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(getManageCoursesQuerySchema, "query"),
  getManageCoursesHandler,
);
router.get(
  "/stats",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  getCourseStatsHandler,
);
router.get(
  "/:id/related",
  validate(courseIdOrSlugParamSchema, "params"),
  validate(getRelatedCoursesQuerySchema, "query"),
  getRelatedCoursesHandler,
);
router.get(
  "/:id",
  validate(courseIdOrSlugParamSchema, "params"),
  getSingleCourseHandler,
);
router.use("/:id/ratings", ratingRoutes);
router.post(
  "/",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(createCourseSchema),
  createCourseHandler,
);
router.patch(
  "/:id/price",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(courseIdParamSchema, "params"),
  validate(updateCoursePriceSchema),
  updateCoursePriceHandler,
);
router.patch(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(courseIdParamSchema, "params"),
  validate(updateCourseSchema),
  updateCourseHandler,
);
router.delete(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(courseIdParamSchema, "params"),
  deleteCourseHandler,
);

export default router;
