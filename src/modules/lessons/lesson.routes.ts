import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { USER_ROLES } from "../users/user.model";
import { createMuxUploadHandler, muxWebhookHandler } from "./lesson.controller";

const router = Router();

router.use(authenticate);

router.post(
	"/",
	authorize(USER_ROLES[1], USER_ROLES[2]),
	// validate(createCourseSchema),
	createMuxUploadHandler,
);

router.post(
	"/webhook/mux",
	authorize(USER_ROLES[1], USER_ROLES[2]),
	// validate(createCourseSchema),
	muxWebhookHandler,
);

export default router;
