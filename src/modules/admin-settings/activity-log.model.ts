import mongoose, { Document, Schema } from "mongoose";

export interface IUserActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  subjectUserId?: mongoose.Types.ObjectId | null;
  actionLabel: string;
  detail: string;
  createdAt: Date;
}

const userActivityLogSchema = new Schema<IUserActivityLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectUserId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actionLabel: { type: String, required: true, trim: true, maxlength: 200 },
    detail: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

userActivityLogSchema.index({ actorId: 1, createdAt: -1 });
userActivityLogSchema.index({ subjectUserId: 1, createdAt: -1 });

export const UserActivityLog =
  (mongoose.models.UserActivityLog as mongoose.Model<IUserActivityLog>) ??
  mongoose.model<IUserActivityLog>("UserActivityLog", userActivityLogSchema);
