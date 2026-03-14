import mongoose, { Document, Schema } from "mongoose";

export interface IRating extends Document {
  _id: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number; // 1-5
  reviewText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: { type: String, maxlength: 2000 },
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

ratingSchema.index({ course: 1, user: 1 }, { unique: true });
ratingSchema.index({ course: 1, createdAt: -1 });

export const Rating =
  (mongoose.models.Rating as mongoose.Model<IRating>) ??
  mongoose.model<IRating>("Rating", ratingSchema);
