import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICourseBookmark extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseBookmarkSchema = new Schema<ICourseBookmark>(
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

courseBookmarkSchema.index({ student: 1, course: 1 }, { unique: true });

export const CourseBookmark =
  (mongoose.models.CourseBookmark as mongoose.Model<ICourseBookmark>) ??
  mongoose.model<ICourseBookmark>("CourseBookmark", courseBookmarkSchema);
