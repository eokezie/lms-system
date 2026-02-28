import mongoose, { Document, Schema } from "mongoose";

export type LessonType = "video" | "article" | "quiz";

export type MuxStatus = "waiting" | "preparing" | "ready" | "errored";

export interface IMuxData {
	uploadId?: string; // Mux direct upload ID (before asset is created)
	assetId?: string; // Mux asset ID (created after upload completes)
	playbackId?: string; // Public playback ID (available once asset is ready)
	status: MuxStatus;
}

export interface IAttachment {
	label: string; // e.g. "Starter Files", "Slides"
	url: string;
}

export interface ILesson extends Document {
	_id: mongoose.Types.ObjectId;
	title: string;
	// Which course this lesson belongs to — makes it easy to query
	// "all lessons for course X" without going through the curriculum array
	course: mongoose.Types.ObjectId;
	type: LessonType;
	// Video lessons
	mux?: IMuxData;
	videoDuration?: number; // seconds — used to calculate course totalDuration
	// Article lessons
	content?: string; // rich text / markdown
	// Shared
	description?: string; // short summary shown before the student starts
	attachments: IAttachment[];
	isFree: boolean; // preview lessons accessible without enrollment
	order: number; // position within its section (for sorting)
	createdAt: Date;
	updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
	{
		title: { type: String, required: true, trim: true, maxlength: 200 },
		course: {
			type: Schema.Types.ObjectId,
			ref: "Course",
			required: true,
			index: true,
		},
		type: {
			type: String,
			enum: ["video", "article", "quiz"],
			required: true,
			default: "video",
		},
		mux: {
			uploadId: { type: String },
			assetId: { type: String, index: true }, // index for webhook lookup
			playbackId: { type: String },
			status: {
				type: String,
				enum: ["waiting", "preparing", "ready", "errored"],
				default: "waiting",
			},
		},
		videoDuration: { type: Number, min: 0 }, // seconds
		// Article
		content: { type: String },
		// Shared
		description: { type: String, maxlength: 500 },
		attachments: [
			{
				label: { type: String, required: true },
				url: { type: String, required: true },
				_id: false,
			},
		],
		isFree: { type: Boolean, default: false },
		// Order within its section — frontend sorts by this when rendering curriculum
		order: { type: Number, required: true, default: 0 },
	},
	{
		timestamps: true,
		toJSON: {
			transform(_doc, ret: Record<string, any>) {
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Fast lookup of all lessons for a given course, in order
lessonSchema.index({ course: 1, order: 1 });

/**
 * Whenever a lesson's videoDuration changes, update the parent course's
 * totalDuration so Card 3 always has an accurate figure without
 * needing to populate and sum lessons at query time.
 */
lessonSchema.post("save", async function () {
	await recalculateCourseDuration(this.course);
});

lessonSchema.post("findOneAndUpdate", async function (doc) {
	if (doc) await recalculateCourseDuration(doc.course);
});

lessonSchema.post("findOneAndDelete", async function (doc) {
	if (doc) await recalculateCourseDuration(doc.course);
});

async function recalculateCourseDuration(courseId: mongoose.Types.ObjectId) {
	const { Course } = await import("../courses/course.model");
	const result = await Lesson.aggregate([
		{ $match: { course: courseId } },
		{ $group: { _id: null, total: { $sum: "$videoDuration" } } },
	]);
	const totalDuration = result[0]?.total ?? 0;
	await Course.findByIdAndUpdate(courseId, { totalDuration });
}

export const Lesson = mongoose.model<ILesson>("Lesson", lessonSchema);
