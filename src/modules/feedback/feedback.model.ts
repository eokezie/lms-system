import mongoose, { Document, Schema, Types } from "mongoose";

export const FEEDBACK_STATUSES = ["open", "reviewed", "closed"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  body: string;
  adminNote?: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 5000 },
    adminNote: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: FEEDBACK_STATUSES,
      default: "open",
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

feedbackSchema.index({ createdAt: -1 });

export const Feedback =
  (mongoose.models.Feedback as mongoose.Model<IFeedback>) ??
  mongoose.model<IFeedback>("Feedback", feedbackSchema);
