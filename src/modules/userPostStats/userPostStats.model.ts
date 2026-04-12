import mongoose, { Document, Schema } from "mongoose";

export interface IUserPostStats extends Document {
  user: mongoose.Types.ObjectId;

  commentCount: number;
  postCount: number;

  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userPostStatsSchema = new Schema<IUserPostStats>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
    },

    commentCount: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },

    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const UserPostStats = mongoose.model<IUserPostStats>(
  "UserPostStats",
  userPostStatsSchema,
);
