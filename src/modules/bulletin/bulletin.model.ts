import { Schema, model, Document, Types } from "mongoose";

export type BulletinType = "new_course" | "event" | "promotion" | "general";

export interface IBulletin extends Document {
	type: BulletinType;
	title: string;
	description: string;
	image?: string;
	ctaLabel?: string; // e.g. "Enroll Now", "Learn More"
	ctaLink?: string; // internal route or external URL
	expiresAt?: Date; // null = never expires
	isActive: boolean;
	createdBy: Types.ObjectId; // admin user ref
	// For new_course bulletins — optional direct course reference
	courseRef?: Types.ObjectId;
}

const bulletinSchema = new Schema<IBulletin>(
	{
		type: {
			type: String,
			enum: ["new_course", "event", "promotion", "general"],
			required: true,
			index: true,
		},
		title: { type: String, required: true, maxlength: 200 },
		description: { type: String, required: true, maxlength: 1000 },
		image: { type: String },
		ctaLabel: { type: String, maxlength: 50 },
		ctaLink: { type: String },
		expiresAt: { type: Date },
		isActive: { type: Boolean, default: true, index: true },
		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
		courseRef: { type: Schema.Types.ObjectId, ref: "Course" },
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

// Active bulletins, most recent first — this is the query that powers the carousel
bulletinSchema.index({ isActive: 1, createdAt: -1 });

export const Bulletin = model<IBulletin>("Bulletin", bulletinSchema);
