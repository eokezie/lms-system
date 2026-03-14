import express, { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { USER_ROLES } from "../users/user.model";
import {
	createLessonHandler,
	createMuxUploadHandler,
	muxWebhookHandler,
} from "./lesson.controller";
import { processFiles } from "@/middleware/multer.middleware";
import { createLessonSchema } from "./lesson.validation";
import { validate } from "@/middleware/validate";

const router = Router();

router.post(
	"/",
	authenticate,
	authorize(USER_ROLES[1], USER_ROLES[2]),
	processFiles,
	validate(createLessonSchema),
	createLessonHandler,
);

router.post(
	"/webhook/mux",
	// express.raw({ type: "application/json" }),
	express.raw({ type: "*/*" }),
	muxWebhookHandler,
);

export default router;
