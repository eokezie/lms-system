import mongoose, { Document, Schema, Types } from "mongoose";
import { FileType } from "@/modules/courses/course.model";

export type CareerPathStatus = "draft" | "published" | "archived";

export enum CareerPathSkillLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
}

export interface ICareerPath extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription: string;
  careerOutcome: string;
  thumbnail?: FileType;
  industryRecognizedCertificate: boolean;
  estimatedDuration: string;
  skillLevel: CareerPathSkillLevel;
  courses: Types.ObjectId[];
  /** Denormalized: students enrolled in this path (kept in sync on enroll/drop). */
  enrollmentCount: number;
  status: CareerPathStatus;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const thumbnailSchema = new Schema<FileType>(
  {
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    fileUrl: { type: String },
  },
  { _id: false },
);

const careerPathSchema = new Schema<ICareerPath>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    shortDescription: { type: String, required: true, maxlength: 2000 },
    careerOutcome: { type: String, required: true, maxlength: 8000 },
    thumbnail: { type: thumbnailSchema, required: false },
    industryRecognizedCertificate: { type: Boolean, default: false },
    estimatedDuration: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    skillLevel: {
      type: String,
      enum: Object.values(CareerPathSkillLevel),
      required: true,
    },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    enrollmentCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

careerPathSchema.index({ status: 1, createdAt: -1 });

careerPathSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = String(this.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export const CareerPath =
  (mongoose.models.CareerPath as mongoose.Model<ICareerPath>) ??
  mongoose.model<ICareerPath>("CareerPath", careerPathSchema);
