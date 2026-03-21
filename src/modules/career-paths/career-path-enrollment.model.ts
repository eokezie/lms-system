import mongoose, { Document, Schema, Types } from "mongoose";

export type CareerPathEnrollmentStatus = "active" | "completed" | "dropped";

export interface ICareerPathEnrollment extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  careerPath: Types.ObjectId;
  status: CareerPathEnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const careerPathEnrollmentSchema = new Schema<ICareerPathEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    careerPath: {
      type: Schema.Types.ObjectId,
      ref: "CareerPath",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
      index: true,
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
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

careerPathEnrollmentSchema.index(
  { student: 1, careerPath: 1 },
  { unique: true },
);

export const CareerPathEnrollment =
  (mongoose.models
    .CareerPathEnrollment as mongoose.Model<ICareerPathEnrollment>) ??
  mongoose.model<ICareerPathEnrollment>(
    "CareerPathEnrollment",
    careerPathEnrollmentSchema,
  );
