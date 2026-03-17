import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { getMyEnrollmentsHandler } from "./enrollment.controller";
import { getStudentEnrollmentsQuerySchema } from "./enrollment.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/my",
  validate(getStudentEnrollmentsQuerySchema, "query"),
  getMyEnrollmentsHandler,
);

export default router;
