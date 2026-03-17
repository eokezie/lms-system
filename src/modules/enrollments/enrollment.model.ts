import mongoose, { Document, Schema, Types } from "mongoose";

export type EnrollmentStatus = "active" | "completed" | "dropped";

export interface IEnrollment extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  paymentRef?: string;
  completedLessons: Types.ObjectId[]; // lesson IDs from course curriculum
  progressPercent: number;
  // Per-lesson progress (0-100). A lesson is "completed" when percent === 100.
  lessonProgress: {
    lesson: Types.ObjectId;
    percent: number;
  }[];
  lastAccessedLessonId?: Types.ObjectId;
  lastAccessedAt: Date; // used for "Continue Learning" card
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
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
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    paymentRef: { type: String },
    completedLessons: [{ type: Schema.Types.ObjectId }], // We use $addToSet when updating so replaying a lesson doesn't double-count.
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    lessonProgress: [
      {
        lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
        percent: { type: Number, min: 0, max: 100 },
      },
    ],
    lastAccessedLessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
    },
    // Updated every time the student opens the course — drives "Continue Learning" sort.
    lastAccessedAt: { type: Date, default: Date.now },
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

// A student can only be enrolled once per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
// Fast lookup for "Continue Learning": most recently accessed course for a student
enrollmentSchema.index({ student: 1, lastAccessedAt: -1 });

export const Enrollment = mongoose.model<IEnrollment>(
  "Enrollment",
  enrollmentSchema,
);
