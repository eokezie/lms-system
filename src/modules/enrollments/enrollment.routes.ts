import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  getMyEnrollmentsHandler,
  enrollFreeCourseHandler,
} from "./enrollment.controller";
import {
  getStudentEnrollmentsQuerySchema,
  enrollFreeCourseBodySchema,
} from "./enrollment.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/my",
  validate(getStudentEnrollmentsQuerySchema, "query"),
  getMyEnrollmentsHandler,
);

router.post(
  "/free",
  validate(enrollFreeCourseBodySchema, "body"),
  enrollFreeCourseHandler,
);

export default router;
