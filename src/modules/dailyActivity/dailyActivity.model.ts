import { Schema, model, Document, Types } from "mongoose";

export interface IDailyActivity extends Document {
	student: Types.ObjectId;
	date: Date; // stored as midnight UTC — one doc per student per day
	minutesSpent: number;
	lessonsCompleted: number;
	coursesTouched: Types.ObjectId[]; // which courses they studied that day
}

const dailyActivitySchema = new Schema<IDailyActivity>(
	{
		student: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		// Normalized to midnight UTC so we can do simple date equality checks
		date: { type: Date, required: true },
		minutesSpent: { type: Number, default: 0, min: 0 },
		lessonsCompleted: { type: Number, default: 0, min: 0 },
		coursesTouched: [{ type: Schema.Types.ObjectId, ref: "Course" }],
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

// One activity record per student per day
dailyActivitySchema.index({ student: 1, date: 1 }, { unique: true });
// Fast range queries: "give me this student's activity for the past 7 days"
dailyActivitySchema.index({ student: 1, date: -1 });

export const DailyActivity = model<IDailyActivity>(
	"DailyActivity",
	dailyActivitySchema,
);
