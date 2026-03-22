import mongoose, { Document, Schema, Types } from "mongoose";

export const LESSON_FLAG_REASONS = [
  "wrong_course",
  "wrong_topic",
  "inappropriate_content",
  "technical_issue",
  "other",
] as const;

export type LessonFlagReason = (typeof LESSON_FLAG_REASONS)[number];

export const LESSON_FLAG_REASON_LABELS: Record<LessonFlagReason, string> = {
  wrong_course: "Wrong course",
  wrong_topic: "Wrong topic",
  inappropriate_content: "Inappropriate content",
  technical_issue: "Technical issue",
  other: "Other",
};

export type LessonFlagStatus = "in_review" | "reviewed";

export interface ILessonFlag extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  reason: LessonFlagReason;
  description: string;
  status: LessonFlagStatus;
  adminNote?: string;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lessonFlagSchema = new Schema<ILessonFlag>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: LESSON_FLAG_REASONS,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8000,
    },
    status: {
      type: String,
      enum: ["in_review", "reviewed"],
      default: "in_review",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 8000,
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

lessonFlagSchema.index({ course: 1, lesson: 1, createdAt: -1 });
lessonFlagSchema.index({ status: 1, createdAt: -1 });

export const LessonFlag =
  (mongoose.models.LessonFlag as mongoose.Model<ILessonFlag>) ??
  mongoose.model<ILessonFlag>("LessonFlag", lessonFlagSchema);
