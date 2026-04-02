import express, { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { USER_ROLES } from "../users/user.model";
import {
  createLessonHandler,
  createMuxUploadHandler,
  muxWebhookHandler,
  updateLessonHandler,
  getLessonByIdHandler,
  deleteLessonHandler,
} from "./lesson.controller";
import { processFiles } from "@/middleware/multer.middleware";
import {
  createLessonSchema,
  lessonIdParamSchema,
  muxUploadIdSchema,
  updateLessonSchema,
} from "./lesson.validation";
import { validate } from "@/middleware/validate";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(createLessonSchema),
  createLessonHandler,
);
router.patch(
  "/:lessonId",
  authenticate,
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  processFiles as any,
  validate(updateLessonSchema),
  updateLessonHandler,
);
router.get(
  "/:lessonId",
  authenticate,
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(lessonIdParamSchema, "params"),
  getLessonByIdHandler,
);
router.delete(
  "/:lessonId",
  authenticate,
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(lessonIdParamSchema, "params"),
  deleteLessonHandler,
);
router.post(
  "/mux",
  authenticate,
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  validate(muxUploadIdSchema),
  createMuxUploadHandler,
);
router.post(
  "/webhook/mux",
  // express.raw({ type: "application/json" }),
  express.raw({ type: "*/*" }),
  muxWebhookHandler,
);

export default router;
