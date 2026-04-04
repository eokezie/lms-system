import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { courseAdvisorySchema } from "./course-advisory.validation";
import { submitCourseAdvisory } from "./course-advisory.controller";

const router = Router();

router.post(
  "/recommend",
  authenticate,
  validate(courseAdvisorySchema),
  submitCourseAdvisory,
);

export default router;
