import mongoose, { Document, Schema } from "mongoose";

export type PostRole = "student" | "instructor" | "admin";

export interface IPost extends Document {
  title: string;
  topic: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorRole: PostRole;

  upvotes: number;
  commentCount: number;

  isFlagged: boolean;
  flaggedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true },
    topic: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      index: true,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    authorRole: {
      type: String,
      enum: ["student", "instructor", "admin"],
      required: true,
    },

    upvotes: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    isFlagged: { type: Boolean, default: false },
    flaggedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

postSchema.index({ topic: 1, createdAt: -1 });
postSchema.index({ upvotes: -1 });
postSchema.index({ title: "text" });

export const Posts = mongoose.model<IPost>("Posts", postSchema);
