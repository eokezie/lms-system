import mongoose, { Document, Schema, Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "badge_earned",
  "certificate_ready",
  "new_course",
  "career_path_unlock",
  "quiz_recommendation",
  "course_progress",
  "discussion_reply",
  "enrollment_confirmation",
  "course_completed",
  "assessment_passed",
  "generic",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message?: string;
  isRead: boolean;
  link?: string;
  actor?: Types.ObjectId | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    metadata: { type: Schema.Types.Mixed },
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

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification>) ??
  mongoose.model<INotification>("Notification", notificationSchema);

export const REPLY_TYPES: NotificationType[] = ["discussion_reply"];
