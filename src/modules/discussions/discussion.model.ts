import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDiscussionThread extends Document {
  _id: Types.ObjectId;
  course: Types.ObjectId;
  lesson?: Types.ObjectId | null;
  student: Types.ObjectId;
  title: string;
  body: string;
  repliesCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussionReply extends Document {
  _id: Types.ObjectId;
  thread: Types.ObjectId;
  student: Types.ObjectId;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const discussionThreadSchema = new Schema<IDiscussionThread>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson" },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true },
    repliesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

discussionThreadSchema.index({ course: 1, lesson: 1, createdAt: -1 });

const discussionReplySchema = new Schema<IDiscussionReply>(
  {
    thread: {
      type: Schema.Types.ObjectId,
      ref: "DiscussionThread",
      required: true,
    },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

discussionReplySchema.index({ thread: 1, createdAt: 1 });

export const DiscussionThread = mongoose.model<IDiscussionThread>(
  "DiscussionThread",
  discussionThreadSchema,
);

export const DiscussionReply = mongoose.model<IDiscussionReply>(
  "DiscussionReply",
  discussionReplySchema,
);
