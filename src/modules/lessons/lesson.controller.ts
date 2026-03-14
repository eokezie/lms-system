import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
	createLessonService,
	createMuxUpload,
	updateLessonService,
	verifyMuxWebhook,
} from "./lesson.service";
import { getUploadedFiles } from "@/helpers/multerHelper";

export const createLessonHandler = catchAsync(
	async (req: Request, res: Response) => {
		const lesson = await createLessonService(req.body);
		sendCreated({
			res,
			message: "Lesson created successfully",
			data: lesson,
		});
	},
);

export const updateLessonHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { lessonId } = req.params;
		const uploadedFiles = getUploadedFiles(req);
		const result = await updateLessonService(lessonId, uploadedFiles, req.body);
		sendCreated({
			res,
			message: "Lesson was updated successfully",
			data: result?.lesson,
			// meta: result?.upload ? { ...result.upload } : undefined,
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
