import { Router } from "express";

import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  addCourseBookmarkHandler,
  removeCourseBookmarkHandler,
  listMyCourseBookmarksHandler,
  listMyBookmarkedCourseIdsHandler,
} from "./bookmark.controller";
import {
  courseBookmarkParamSchema,
  listBookmarksQuerySchema,
} from "./bookmark.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/courses",
  authorize(USER_ROLES[0]),
  validate(listBookmarksQuerySchema, "query"),
  listMyCourseBookmarksHandler,
);

router.get(
  "/courses/ids",
  authorize(USER_ROLES[0]),
  listMyBookmarkedCourseIdsHandler,
);

router.post(
  "/courses/:courseId",
  authorize(USER_ROLES[0]),
  validate(courseBookmarkParamSchema, "params"),
  addCourseBookmarkHandler,
);

router.delete(
  "/courses/:courseId",
  authorize(USER_ROLES[0]),
  validate(courseBookmarkParamSchema, "params"),
  removeCourseBookmarkHandler,
);

export default router;
