import mongoose, { Document, Schema } from "mongoose";

export type ICourseStatus = "draft" | "published" | "archived";

export enum CourseStatus {
	draft = "draft",
	published = "published",
	archived = "archived",
}

export interface ICourseModule {
	sectionTitle: string;
	lessons: mongoose.Types.ObjectId[];
	moduleId: string;
}

export interface ICtaSection {
	heading: string;
	subtext: string;
}

export type FileType = {
	fileName: string;
	fileType: string;
	fileSize: number;
	fileUrl: string;
};

export interface ICourse extends Document {
	_id: mongoose.Types.ObjectId;
	title: string;
	slug: string;
	description: string;
	summary: string;
	coverImage?: FileType;
	skillLevel: string;
	instructor: mongoose.Types.ObjectId;
	estimatedCompletionTime: number;
	category: mongoose.Types.ObjectId;
	tags: string[];
	status: ICourseStatus;
	price: number;
	isFree: boolean;
	hasDownloadableResources: boolean;
	hasQuizzes: boolean;
	hasOnDemandVideo: boolean;
	hasInstructorQA: boolean;
	hasCertificate: boolean;
	requirements: string[];
	whatToLearn: string[];
	ctaSection: ICtaSection;
	courseModules: ICourseModule[];
	enrollmentCount: number;
	averageRating: number;
	totalRatings: number;
	// Denormalized sum of all lesson videoDurations in seconds.
	// Kept in sync by a post-save hook on the Lesson model so we never
	// have to populate + sum lessons just to show "4h 30m" on a course card.
	totalDuration: number;
	createdAt: Date;
	updatedAt: Date;
}

const courseModuleSchema = new Schema<ICourseModule>(
	{
		sectionTitle: { type: String, required: false },
		lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
		moduleId: { type: String, unique: true },
	},
	{ _id: true },
);

const courseSchema = new Schema<ICourse>(
	{
		title: { type: String, required: true, trim: true, maxlength: 200 },
		slug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			index: true,
		},
		description: { type: String, required: true, maxlength: 5000 },
		summary: { type: String, required: true },
		skillLevel: { type: String, required: true },
		estimatedCompletionTime: { type: Number, required: false },
		coverImage: {
			fileName: {
				required: false,
				type: String,
			},
			fileType: {
				required: false,
				type: String,
			},
			fileSize: {
				required: false,
				type: Number,
			},
			fileUrl: {
				required: false,
				type: String,
			},
		},
		instructor: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			index: true,
		},
		category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
		tags: [{ type: String }],
		status: {
			type: String,
			enum: CourseStatus,
			default: CourseStatus.draft,
			index: true,
		},
		price: { type: Number, default: 0, min: 0 },
		isFree: { type: Boolean, default: true },
		hasDownloadableResources: { type: Boolean, default: true },
		hasQuizzes: { type: Boolean, default: true },
		hasOnDemandVideo: { type: Boolean, default: true },
		hasInstructorQA: { type: Boolean, default: false },
		hasCertificate: { type: Boolean, default: true },
		requirements: [{ type: String }],
		whatToLearn: [{ type: String }],
		ctaSection: {
			heading: { type: String },
			subtext: { type: String },
		},
		courseModules: [courseModuleSchema],
		enrollmentCount: { type: Number, default: 0, min: 0 },
		averageRating: { type: Number, default: 0, min: 0, max: 5 },
		totalRatings: { type: Number, default: 0 },
		totalDuration: { type: Number, default: 0, min: 0 }, // seconds
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform(_doc, ret: Record<string, any>) {
				delete ret.__v;
				return ret;
			},
		},
	},
);

// Single-course student lookup: match by (status, id) or (status, slug)
courseSchema.index({ status: 1, _id: 1 });
courseSchema.index({ status: 1, slug: 1 });

// Auto-generate slug from title if not provided
courseSchema.pre("validate", function (next) {
	if (!this.slug && this.title) {
		this.slug = this.title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}
	next();
});

// export const Course = mongoose.model<ICourse>("Course", courseSchema);
export const Course =
	(mongoose.models.Course as mongoose.Model<ICourse>) ??
	mongoose.model<ICourse>("Course", courseSchema);
