import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "../users/user.model";
import {
  createCourseHandler,
  getExploreCoursesHandler,
  getRelatedCoursesHandler,
  getSingleCourseHandler,
  getCoursePlayerHandler,
  updateCoursePriceHandler,
  getManageCoursesHandler,
  getSubmissionsInReviewHandler,
  getSubmissionsArchivedHandler,
  getCourseStatsHandler,
  updateCourseHandler,
  deleteCourseHandler,
} from "./course.controller";
import {
  createCourseSchema,
  getExploreCoursesQuerySchema,
  getManageCoursesQuerySchema,
  getSubmissionsAdminQuerySchema,
  courseIdParamSchema,
  courseIdOrSlugParamSchema,
  getRelatedCoursesQuerySchema,
  updateCoursePriceSchema,
  updateCourseSchema,
} from "./course.validation";
import { getCourseEnrollmentsForCourseHandler } from "@/modules/enrollments/enrollment.controller";
import { getCourseEnrollmentsQuerySchema } from "@/modules/enrollments/enrollment.validation";
import { processFiles } from "@/middleware/multer.middleware";
import ratingRoutes from "../ratings/rating.routes";
import noteRoutes from "@/modules/notes/note.routes";
import discussionRoutes from "@/modules/discussions/discussion.routes";


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
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(getManageCoursesQuerySchema, "query") as any,
  getManageCoursesHandler as any,
);
router.get(
  "/stats",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  getCourseStatsHandler as any,
);
router.get(
  "/submissions/in-review",
  authorize(USER_ROLES[2], USER_ROLES[3]) as any,
  validate(getSubmissionsAdminQuerySchema, "query") as any,
  getSubmissionsInReviewHandler as any,
);
router.get(
  "/submissions/archived",
  authorize(USER_ROLES[2], USER_ROLES[3]) as any,
  validate(getSubmissionsAdminQuerySchema, "query") as any,
  getSubmissionsArchivedHandler as any,
);
router.get(
  "/:id/related",
  validate(courseIdOrSlugParamSchema, "params") as any,
  validate(getRelatedCoursesQuerySchema, "query") as any,
  getRelatedCoursesHandler as any,
);
router.get(
  "/:id/enrollments",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(courseIdParamSchema, "params") as any,
  validate(getCourseEnrollmentsQuerySchema, "query") as any,
  getCourseEnrollmentsForCourseHandler as any,
);
router.use(
  "/:id/discussions",
  authorize(USER_ROLES[0], USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  discussionRoutes,
);
router.use("/:id/reviews", ratingRoutes);
router.get(
  "/:id",
  validate(courseIdOrSlugParamSchema, "params") as any,
  getSingleCourseHandler as any,
);
// Typed incompatibility between passport/express definitions; cast handler to any.
router.get("/:id/player", getCoursePlayerHandler as any as any);
router.use("/:id/ratings", ratingRoutes);
// Lesson notes nested under course + lesson for player UI
router.use("/:courseId/lessons/:lessonId/notes", noteRoutes);
router.post(
  "/",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  processFiles as any,
  validate(createCourseSchema) as any,
  createCourseHandler as any,
);
router.patch(
  "/:id/price",
  authorize(USER_ROLES[2], USER_ROLES[3]) as any,
  validate(courseIdParamSchema, "params") as any,
  validate(updateCoursePriceSchema) as any,
  updateCoursePriceHandler as any,
);
router.patch(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(courseIdParamSchema, "params") as any,
  validate(updateCourseSchema) as any,
  updateCourseHandler as any,
);
router.delete(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(courseIdParamSchema, "params") as any,
  deleteCourseHandler as any,
);

export default router;
