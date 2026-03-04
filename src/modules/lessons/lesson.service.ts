import { logger } from "@/utils/logger";
import { ApiError } from "@/utils/apiError";
import { UpdateLessonDto } from "./lesson.type";
import { findLessonById, updateLessonById } from "./lesson.repository";
import { mux } from "@/libs/mux";
import { MuxStatus } from "./lesson.model";
import { env } from "@/config/env";

export async function updateLessonService(
	lessonId: string,
	dto: UpdateLessonDto,
) {
	const lesson = await updateLessonById(lessonId, dto);
	return lesson;
}

export async function createMuxUpload(lessonId: string) {
	const lesson = await findLessonById(lessonId);
	if (!lesson) throw ApiError.notFound("Lesson not found");

	const upload = await mux.video.uploads.create({
		cors_origin: "*",
		new_asset_settings: {
			playback_policy: ["public"],
			passthrough: lessonId, // ← tie the webhook back to this lesson
		},
	});

	// Persist the uploadId so the webhook can look up by assetId later
	lesson.mux = {
		uploadId: upload.id,
		status: MuxStatus.waiting,
	};
	await lesson.save();
	return upload;
}

export async function verifyMuxWebhook(req: any) {
	const muxSigningSecret = env.MUX_SIGNING_SECRET;

	try {
		mux.webhooks.verifySignature(req.body, req.headers, muxSigningSecret);
	} catch (error: any) {
		console.error(error);
		throw ApiError.badRequest("Invalid Mux signature");
	}

	const event = JSON.parse(req.body.toString());
	const { type, data } = event;

	switch (type) {
		// Fired when Mux starts processing
		case "video.asset.created": {
			const lessonId = data.passthrough;
			await updateLessonById(lessonId, {
				"mux.assetId": data.id,
				"mux.status": MuxStatus.preparing,
			});
			break;
		}

		// Fired when the asset is fully ready to stream
		case "video.asset.ready": {
			const lessonId = data.passthrough;
			const playbackId = data.playback_ids?.[0]?.id;

			await updateLessonById(lessonId, {
				"mux.assetId": data.id,
				"mux.playbackId": playbackId,
				"mux.status": MuxStatus.ready,
				// Mux gives duration in seconds as a float
				videoDuration: Math.round(data.duration ?? 0),
			});
			break;
		}

		case "video.asset.errored": {
			const lessonId = data.passthrough;
			await updateLessonById(lessonId, {
				"mux.status": MuxStatus.errored,
			});
			break;
		}

		default:
			break;
	}
}
