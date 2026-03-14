import express, { Router } from "express";
import { muxWebhookHandler } from "./lesson.controller";

const router = Router();

router.post(
	"/webhook",
	express.raw({ type: "application/json" }),
	muxWebhookHandler,
);

export default router;
