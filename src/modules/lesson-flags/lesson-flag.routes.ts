import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  createLessonFlagHandler,
  listLessonFlagsHandler,
  getLessonFlagByIdHandler,
  patchLessonFlagHandler,
} from "./lesson-flag.controller";
import {
  createLessonFlagSchema,
  listLessonFlagsQuerySchema,
  lessonFlagIdParamSchema,
  patchLessonFlagSchema,
} from "./lesson-flag.validation";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(USER_ROLES[0]),
  validate(createLessonFlagSchema),
  createLessonFlagHandler,
);

router.get(
  "/",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(listLessonFlagsQuerySchema, "query"),
  listLessonFlagsHandler,
);

router.get(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(lessonFlagIdParamSchema, "params"),
  getLessonFlagByIdHandler,
);

router.patch(
  "/:id",
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(lessonFlagIdParamSchema, "params"),
  validate(patchLessonFlagSchema),
  patchLessonFlagHandler,
);

export default router;
