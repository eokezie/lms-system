import { logger } from "@/utils/logger";
import { ApiError } from "@/utils/apiError";
import { CreateLessonDto, UpdateLessonDto } from "./lesson.type";
import {
	createLesson,
	deleteLessonById,
	findLessonById,
	updateLessonById,
} from "./lesson.repository";
import { mux } from "@/libs/mux";
import { Lesson, LessonType, MuxStatus } from "./lesson.model";
import { env } from "@/config/env";
import { UploadedFiles } from "@/helpers/multerHelper";
import { findCourseById } from "../courses/course.repository";
import { Enrollment } from "../enrollments/enrollment.model";
import { LessonNote } from "../notes/note.model";
import {
	DiscussionReply,
	DiscussionThread,
} from "../discussions/discussion.model";
import { LessonFlag } from "../lesson-flags/lesson-flag.model";
import { uploadFile } from "@/libs/spacesFileUpload";
import mongoose from "mongoose";

export async function updateLessonService(
	lessonId: string,
	uploadedFiles: UploadedFiles,
	dto: UpdateLessonDto,
) {
	const lesson = await findLessonById(lessonId);
	if (!lesson) throw ApiError.notFound("No Lesson matched the provided ID");

	const lessonTitle = dto.title ?? lesson.title;
	const { thumbnailImage, captionFile, resources } = uploadedFiles;
	const [thumbnailImageData, captionFileData, resourcesData] =
		await Promise.all([
			thumbnailImage
				? uploadFile(
						thumbnailImage,
						`Courses/${lesson.course.toString()}/Lessons/${lessonTitle}/Thumbnail`,
					)
				: Promise.resolve(undefined),
			captionFile
				? uploadFile(
						captionFile,
						`Courses/${lesson.course.toString()}/Lessons/${lessonTitle}/Caption`,
					)
				: Promise.resolve(undefined),
			resources?.length
				? Promise.all(
						resources.map((resourceFile) =>
							uploadFile(
								resourceFile,
								`Courses/${lesson.course.toString()}/Lessons/${lessonTitle}/Resources`,
							),
						),
					)
				: Promise.resolve(undefined),
		]);

	// ---- parse stringified formdata fields per lesson type ----
	switch (dto.type) {
		case LessonType.article: {
			if (dto.article && typeof dto.article === "string") {
				dto.article = JSON.parse(dto.article);
			}
			break;
		}
		case LessonType.quiz: {
			if (dto.questions && typeof dto.questions === "string") {
				dto.questions = JSON.parse(dto.questions);
			}
			break;
		}
		// video: mux is handled in a separate endpoint, nothing to do here
		default:
			break;
	}

	// ---- build update payload — only include fields that were actually sent ----
	const updateData = {
		...dto,
		...(thumbnailImageData && { thumbnailImage: thumbnailImageData }),
		...(captionFileData && { captionFile: captionFileData }),
		...(resourcesData && { resources: resourcesData }),
		// ...(upload && {
		// 	mux: { uploadId: upload.id, status: MuxStatus.waiting },
		// }),
	};

	const updatedLesson = await updateLessonById(lessonId, updateData);
	if (!updatedLesson) throw ApiError.badRequest("Failed to update lesson!");

	// return { lesson: updatedLesson, ...(upload && { upload }) };
	return { lesson: updatedLesson };
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
	console.log("Content-Type:", req.headers["content-type"]);
	console.log("Is Buffer:", Buffer.isBuffer(req.body));
	console.log("Body type:", typeof req.body);

	const muxSigningSecret = env.MUX_SIGNING_SECRET;
	console.log("Secret:", muxSigningSecret);
	console.log("Body string:", req.body.toString().substring(0, 100));
	console.log("Sig header:", req.headers["mux-signature"]);

	console.log("In Webhook>>");

	try {
		console.log("ABout to Verify !!");
		mux.webhooks.verifySignature(
			req.body.toString(),
			req.headers,
			muxSigningSecret,
		);
	} catch (error: any) {
		console.error(error);
		throw ApiError.badRequest("Invalid Mux signature");
	}

	console.log("Verified!");
	const event = JSON.parse(req.body.toString());
	const { type, data } = event;

	console.log("Type >>", type);
	console.log("Data >>", data);

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
	console.log("Done!");
}

// export async function createLessonService(
// 	uploadedFiles: UploadedFiles,
// 	dto: CreateLessonDto,
// ) {
// 	const session = await mongoose.startSession();

// 	try {
// 		const result = await session.withTransaction(async () => {
// 			const course = await findCourseById(dto.courseId, session);
// 			if (!course) throw ApiError.notFound("No course matched the provided ID");

// 			const { thumbnailImage, captionFile, resources } = uploadedFiles;

// 			const [thumbnailImageData, captionFileData, resourcesData] =
// 				await Promise.all([
// 					thumbnailImage
// 						? uploadFile(
// 								thumbnailImage,
// 								`{Courses/${dto.courseId}/Lessons/${dto.title}/Thumbnail`,
// 							)
// 						: Promise.resolve(undefined),
// 					captionFile
// 						? uploadFile(
// 								captionFile,
// 								`{Courses/${dto.courseId}/Lessons/${dto.title}/Caption`,
// 							)
// 						: Promise.resolve(undefined),
// 					Promise.all(
// 						resources.map((resourceFile) =>
// 							uploadFile(
// 								resourceFile,
// 								`{Courses/${dto.courseId}/Lessons/${dto.title}/Resources`,
// 							),
// 						),
// 					),
// 				]);

// 			const [lesson] = await createLesson(
// 				dto.courseId,
// 				{
// 					...dto,
// 					thumbnailImage: thumbnailImageData,
// 					captionFile: captionFileData,
// 					resources: resourcesData,
// 				},
// 				session,
// 			);
// 			if (!lesson) throw ApiError.badRequest("Failed to create lesson!");

// 			const targetModule = course.courseModules.find(
// 				(mod) => mod.moduleId === dto.moduleId,
// 			);

// 			if (targetModule) {
// 				const alreadyExists = targetModule.lessons.some((id) =>
// 					id.equals(lesson._id),
// 				);
// 				if (!alreadyExists) {
// 					targetModule.lessons.push(lesson._id);
// 				}
// 			} else {
// 				course.courseModules.push({
// 					sectionTitle:
// 						dto.moduleTitle ?? `Module ${course.courseModules.length + 1}`,
// 					lessons: [lesson._id],
// 					moduleId: dto.moduleId,
// 				});
// 			}

// 			await course.save({ session });

// 			if (dto.type === LessonType.video) {
// 				const upload = await mux.video.uploads.create({
// 					cors_origin: "*",
// 					new_asset_settings: {
// 						playback_policy: ["public"],
// 						passthrough: lesson._id.toString(), // ← tie the webhook back to this lesson
// 					},
// 				});

// 				// Persist the uploadId so the webhook can look up by assetId later
// 				lesson.mux = {
// 					uploadId: upload.id,
// 					status: MuxStatus.waiting,
// 				};
// 				await lesson.save({ session });
// 				return { lesson, upload };
// 			}

// 			return { lesson };
// 		});

// 		return result;
// 	} catch (error: any) {
// 		throw error;
// 	} finally {
// 		await session.endSession();
// 	}
// }

// export async function createLessonService(
// 	uploadedFiles: UploadedFiles,
// 	dto: CreateLessonDto,
// ) {
// 	console.log("Step 1: Starting file uploads");
// 	// ---- do all external calls BEFORE the transaction ----
// 	const { thumbnailImage, captionFile, resources } = uploadedFiles;
// 	const [thumbnailImageData, captionFileData, resourcesData] =
// 		await Promise.all([
// 			thumbnailImage
// 				? uploadFile(
// 						thumbnailImage,
// 						`Courses/${dto.courseId}/Lessons/${dto.title}/Thumbnail`,
// 					)
// 				: Promise.resolve(undefined),
// 			captionFile
// 				? uploadFile(
// 						captionFile,
// 						`Courses/${dto.courseId}/Lessons/${dto.title}/Caption`,
// 					)
// 				: Promise.resolve(undefined),
// 			Promise.all(
// 				resources.map((resourceFile) =>
// 					uploadFile(
// 						resourceFile,
// 						`Courses/${dto.courseId}/Lessons/${dto.title}/Resources`,
// 					),
// 				),
// 			),
// 		]);
// 	console.log("Step 1: Done");

// 	let upload: any;
// 	if (dto.type === LessonType.video) {
// 		console.log("Step 2: Creating mux upload");
// 		upload = await mux.video.uploads.create({
// 			cors_origin: "*",
// 			new_asset_settings: {
// 				playback_policy: ["public"],
// 				passthrough: `${dto.courseId}_${dto.title}`, // no lessonId yet, update after
// 			},
// 		});
// 		console.log("Step 2: Done", upload.id);
// 	}

// 	// ---- transaction is now purely fast DB writes ----
// 	const session = await mongoose.startSession();
// 	try {
// 		const result = await session.withTransaction(async () => {
// 			console.log("Step 3: Finding course");
// 			const course = await findCourseById(dto.courseId, session);
// 			if (!course) throw ApiError.notFound("No course matched the provided ID");
// 			console.log("Step 3: Done", course?._id);

// 			console.log("Step 4: Creating lesson");
// 			const [lesson] = await createLesson(
// 				dto.courseId,
// 				{
// 					...dto,
// 					thumbnailImage: thumbnailImageData,
// 					captionFile: captionFileData,
// 					resources: resourcesData,
// 					...(upload && {
// 						mux: { uploadId: upload.id, status: MuxStatus.waiting },
// 					}),
// 				},
// 				session,
// 			);
// 			if (!lesson) throw ApiError.badRequest("Failed to create lesson!");
// 			console.log("Step 4: Done", lesson?._id);

// 			const targetModule = course.courseModules.find(
// 				(mod) => mod.moduleId === dto.moduleId,
// 			);

// 			if (targetModule) {
// 				const alreadyExists = targetModule.lessons.some((id) =>
// 					id.equals(lesson._id),
// 				);
// 				if (!alreadyExists) targetModule.lessons.push(lesson._id);
// 			} else {
// 				course.courseModules.push({
// 					sectionTitle:
// 						dto.moduleTitle ?? `Module ${course.courseModules.length + 1}`,
// 					lessons: [lesson._id],
// 					moduleId: dto.moduleId,
// 				});
// 			}

// 			console.log("Step 5: Saving course");
// 			await course.save({ session });
// 			console.log("Step 5: Done");

// 			return { lesson, upload };
// 		});

// 		return result;
// 	} catch (error: any) {
// 		console.error("Transaction failed at step:", error.message);
// 		throw error;
// 	} finally {
// 		await session.endSession();
// 	}
// }

export async function createLessonService(dto: CreateLessonDto) {
	try {
		const course = await findCourseById(dto.courseId);
		if (!course) throw ApiError.notFound("No course matched the provided ID");

		const lesson = await createLesson(dto.courseId, {});
		if (!lesson) throw ApiError.badRequest("Failed to create lesson!");

		const targetModule = course.courseModules.find(
			(mod) => mod.moduleId === dto.moduleId,
		);

		if (targetModule) {
			const alreadyExists = targetModule.lessons.some((id) =>
				id.equals(lesson._id),
			);
			if (!alreadyExists) targetModule.lessons.push(lesson._id);
		} else {
			course.courseModules.push({
				sectionTitle:
					dto.moduleTitle ?? `Module ${course.courseModules.length + 1}`,
				lessons: [lesson._id],
				moduleId: dto.moduleId,
			});
		}

		await course.save();

		return lesson;
	} catch (error: any) {
		console.error("Transaction failed at step:", error.message);
		throw error;
	}
}

export async function getLessonByIdService(lessonId: string) {
	const lesson = await findLessonById(lessonId);
	if (!lesson) throw ApiError.notFound("No Lesson matched the provided ID");

	return lesson;
}

async function deleteDiscussionsForLesson(
	lessonId: mongoose.Types.ObjectId,
): Promise<void> {
	const threads = await DiscussionThread.find({ lesson: lessonId })
		.select("_id")
		.lean()
		.exec();
	if (threads.length === 0) return;
	const threadIds = threads.map((t) => t._id);
	await DiscussionReply.deleteMany({ thread: { $in: threadIds } }).exec();
	await DiscussionThread.deleteMany({ _id: { $in: threadIds } }).exec();
}

export async function deleteLessonService(lessonId: string) {
	const lesson = await findLessonById(lessonId);
	if (!lesson) throw ApiError.notFound("No Lesson matched the provided ID");

	const courseId = lesson.course;
	const lessonOid = lesson._id;

	if (courseId) {
		const course = await findCourseById(courseId.toString());
		if (course) {
			for (const mod of course.courseModules) {
				mod.lessons = mod.lessons.filter((id) => !id.equals(lessonOid));
			}
			await course.save();
		}

		const totalBefore = await Lesson.countDocuments({ course: courseId });
		const newTotal = Math.max(0, totalBefore - 1);

		const enrollments = await Enrollment.find({ course: courseId }).exec();
		for (const e of enrollments) {
			e.completedLessons = e.completedLessons.filter(
				(id) => !id.equals(lessonOid),
			);
			e.lessonProgress = e.lessonProgress.filter(
				(p) => !p.lesson.equals(lessonOid),
			);
			if (e.lastAccessedLessonId?.equals(lessonOid)) {
				e.set("lastAccessedLessonId", undefined);
			}
			if (newTotal > 0) {
				e.progressPercent = Math.min(
					100,
					Math.round((e.completedLessons.length / newTotal) * 100),
				);
			} else {
				e.progressPercent = 0;
			}
			await e.save();
		}

		await Promise.all([
			LessonNote.deleteMany({ course: courseId, lesson: lessonOid }).exec(),
			LessonFlag.deleteMany({ lesson: lessonOid }).exec(),
			deleteDiscussionsForLesson(lessonOid),
		]);
	}

	const deleted = await deleteLessonById(lessonId);
	if (!deleted) throw ApiError.badRequest("Failed to delete lesson");

	return deleted;
}
