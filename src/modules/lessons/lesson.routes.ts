import express, { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { USER_ROLES } from "../users/user.model";
import { createMuxUploadHandler, muxWebhookHandler } from "./lesson.controller";

const router = Router();

router.post(
	"/",
	authenticate,
	authorize(USER_ROLES[1], USER_ROLES[2]),
	// validate(createCourseSchema),
	createMuxUploadHandler,
);

router.post(
	"/webhook/mux",
	// express.raw({ type: "application/json" }),
	express.raw({ type: "*/*" }),
	muxWebhookHandler,
);

export default router;
