import mongoose, { Document, Schema, Types } from "mongoose";

export interface IForumTopic extends Document {
  _id: Types.ObjectId;
  name: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const forumTopicSchema = new Schema<IForumTopic>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    postCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ForumTopic =
  (mongoose.models.ForumTopic as mongoose.Model<IForumTopic>) ??
  mongoose.model<IForumTopic>("ForumTopic", forumTopicSchema);

export type ForumPostStatus = "flagged" | "unflagged";

export interface IForumPost extends Document {
  _id: Types.ObjectId;
  topic: Types.ObjectId;
  author: Types.ObjectId;
  title: string;
  content: string;
  viewCount: number;
  replyCount: number;
  isFlagged: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumPostSchema = new Schema<IForumPost>(
  {
    topic: {
      type: Schema.Types.ObjectId,
      ref: "ForumTopic",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true, maxlength: 10000 },
    viewCount: { type: Number, default: 0, min: 0 },
    replyCount: { type: Number, default: 0, min: 0 },
    isFlagged: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ replyCount: -1 });

export const ForumPost =
  (mongoose.models.ForumPost as mongoose.Model<IForumPost>) ??
  mongoose.model<IForumPost>("ForumPost", forumPostSchema);

export interface IForumReply extends Document {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  attachments: string[];
  isFlagged: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumReplySchema = new Schema<IForumReply>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "ForumPost",
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    attachments: [{ type: String }],
    isFlagged: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ForumReply =
  (mongoose.models.ForumReply as mongoose.Model<IForumReply>) ??
  mongoose.model<IForumReply>("ForumReply", forumReplySchema);

export type ForumNoteTargetType = "post" | "reply";

export interface IForumNote extends Document {
  _id: Types.ObjectId;
  targetType: ForumNoteTargetType;
  targetId: Types.ObjectId;
  content: string;
  addedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const forumNoteSchema = new Schema<IForumNote>(
  {
    targetType: { type: String, enum: ["post", "reply"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    content: { type: String, required: true, maxlength: 2000 },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

forumNoteSchema.index({ targetType: 1, targetId: 1 });

export const ForumNote =
  (mongoose.models.ForumNote as mongoose.Model<IForumNote>) ??
  mongoose.model<IForumNote>("ForumNote", forumNoteSchema);

export type ForumFlagStatus = "pending" | "resolved" | "dismissed";

export interface IForumFlag extends Document {
  _id: Types.ObjectId;
  targetType: ForumNoteTargetType;
  targetId: Types.ObjectId;
  reporter: Types.ObjectId;
  reason: string;
  explanation: string;
  status: ForumFlagStatus;
  actionTaken?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const forumFlagSchema = new Schema<IForumFlag>(
  {
    targetType: { type: String, enum: ["post", "reply"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, maxlength: 200 },
    explanation: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },
    actionTaken: { type: String, maxlength: 500 },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

forumFlagSchema.index({ targetType: 1, targetId: 1 });
forumFlagSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  { unique: true },
);

export const ForumFlag =
  (mongoose.models.ForumFlag as mongoose.Model<IForumFlag>) ??
  mongoose.model<IForumFlag>("ForumFlag", forumFlagSchema);

export interface IForumGuideline extends Document {
  _id: Types.ObjectId;
  icon: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const forumGuidelineSchema = new Schema<IForumGuideline>(
  {
    icon: { type: String, required: true, maxlength: 50 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ForumGuideline =
  (mongoose.models.ForumGuideline as mongoose.Model<IForumGuideline>) ??
  mongoose.model<IForumGuideline>("ForumGuideline", forumGuidelineSchema);

export type ModerationActionType =
  | "note_added"
  | "note_deleted"
  | "post_deleted"
  | "reply_deleted"
  | "topic_created"
  | "topic_edited"
  | "topic_deleted"
  | "guideline_created"
  | "guideline_edited"
  | "guideline_deleted"
  | "flag_resolved"
  | "flag_dismissed"
  | "admin_replied"
  | "user_banned"
  | "user_muted"
  | "user_restricted"
  | "user_access_updated";

export interface IForumModerationLog extends Document {
  _id: Types.ObjectId;
  actor: Types.ObjectId;
  actionType: ModerationActionType;
  targetType?: string;
  targetId?: Types.ObjectId;
  details?: string;
  createdAt: Date;
}

const forumModerationLogSchema = new Schema<IForumModerationLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actionType: { type: String, required: true, index: true },
    targetType: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    details: { type: String, maxlength: 500 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

forumModerationLogSchema.index({ createdAt: -1 });

export const ForumModerationLog =
  (mongoose.models.ForumModerationLog as mongoose.Model<IForumModerationLog>) ??
  mongoose.model<IForumModerationLog>(
    "ForumModerationLog",
    forumModerationLogSchema,
  );

export type ForumAccessStatus = "active" | "banned" | "muted" | "restricted";

export interface IForumUserAccess extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  status: ForumAccessStatus;
  reason?: string;
  duration?: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const forumUserAccessSchema = new Schema<IForumUserAccess>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "banned", "muted", "restricted"],
      default: "active",
      index: true,
    },
    reason: { type: String, maxlength: 500 },
    duration: { type: String, maxlength: 100 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const ForumUserAccess =
  (mongoose.models.ForumUserAccess as mongoose.Model<IForumUserAccess>) ??
  mongoose.model<IForumUserAccess>("ForumUserAccess", forumUserAccessSchema);
