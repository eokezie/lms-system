import mongoose, { Document, Schema } from "mongoose";

export interface IPostUpvotes extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
}

const postUpvotesSchema = new Schema<IPostUpvotes>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true },
);

postUpvotesSchema.index({ user: 1, post: 1 }, { unique: true });

export const PostUpvotes = mongoose.model<IPostUpvotes>(
  "PostUpvotes",
  postUpvotesSchema,
);
