import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { updateLessonProgressSchema } from "./progress.validation";
import { updateLessonProgressHandler } from "./progress.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/courses/:courseId/lessons/:lessonId",
  validate(updateLessonProgressSchema),
  updateLessonProgressHandler,
);

export default router;
