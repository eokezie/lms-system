import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
	createMuxUpload,
	updateLessonService,
	verifyMuxWebhook,
} from "./lesson.service";

export const updateLessonHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { lessonId } = req.params;
		const lesson = await updateLessonService(lessonId, req.body);
		sendSuccess({
			res,
			message: "Lesson updated successfully",
			data: { lesson },
		});
	},
);

export const createMuxUploadHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { lessonId } = req.body;
		const upload = await createMuxUpload(lessonId);
		sendSuccess({
			res,
			message: "Mux upload url generated successfully",
			data: { uploadUrl: upload.url, uploadId: upload.id },
		});
	},
);

export const muxWebhookHandler = catchAsync(
	async (req: Request, res: Response) => {
		await verifyMuxWebhook(req);
		sendSuccess({
			res,
			message: "Mux webhook signature verified successfully",
		});
	},
);
