import express, { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { USER_ROLES } from "../users/user.model";
import {
  createLessonHandler,
  createMuxUploadHandler,
  muxWebhookHandler,
  updateLessonHandler,
} from "./lesson.controller";
import { processFiles } from "@/middleware/multer.middleware";
import {
  createLessonSchema,
  muxUploadIdSchema,
  updateLessonSchema,
} from "./lesson.validation";
import { validate } from "@/middleware/validate";
import noteRoutes from "@/modules/notes/note.routes";

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
// Nested routes: lesson notes for a specific course & lesson
router.use("/:lessonId/notes", authenticate, noteRoutes);
router.get(
  "/:lessonId",
  authenticate,
  authorize(USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]),
  updateLessonHandler,
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
