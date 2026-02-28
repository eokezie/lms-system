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
}

export interface ICourse extends Document {
	_id: mongoose.Types.ObjectId;
	title: string;
	slug: string;
	description: string;
	coverImage?: string;
	instructor: mongoose.Types.ObjectId;
	category: mongoose.Types.ObjectId;
	tags: string[];
	status: ICourseStatus;
	price: number;
	isFree: boolean;
	courseModule: ICourseModule[];
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
		sectionTitle: { type: String, required: true },
		lessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
	},
	{ _id: false },
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
		coverImage: { type: String },
		instructor: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		category: { type: Schema.Types.ObjectId, ref: "Category" },
		tags: [{ type: String }],
		status: {
			type: String,
			enum: CourseStatus,
			default: CourseStatus.draft,
			index: true,
		},
		price: { type: Number, default: 0, min: 0 },
		isFree: { type: Boolean, default: true },
		courseModule: [courseModuleSchema],
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

export const Course = mongoose.model<ICourse>("Course", courseSchema);
