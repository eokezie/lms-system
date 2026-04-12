import mongoose, { Document, Schema, Types } from "mongoose";

export const SUPPORT_CONVERSATION_STATUSES = [
  "bot_active",
  "waiting_for_agent",
  "agent_active",
  "closed",
] as const;

export type SupportConversationStatus =
  (typeof SUPPORT_CONVERSATION_STATUSES)[number];

export const SUPPORT_MESSAGE_SENDER_TYPES = [
  "user",
  "bot",
  "agent",
  "system",
] as const;

export type SupportMessageSenderType =
  (typeof SUPPORT_MESSAGE_SENDER_TYPES)[number];

export interface ISupportConversation extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  status: SupportConversationStatus;
  assignedAgent?: Types.ObjectId | null;
  subject?: string;
  lastMessagePreview?: string;
  lastMessageAt: Date;
  closedAt?: Date | null;
  lastReadByUser?: Date | null;
  lastReadByAgent?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const supportConversationSchema = new Schema<ISupportConversation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: SUPPORT_CONVERSATION_STATUSES,
      default: "bot_active",
      index: true,
    },
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    subject: { type: String },
    lastMessagePreview: { type: String },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    closedAt: { type: Date, default: null },
    lastReadByUser: { type: Date, default: null },
    lastReadByAgent: { type: Date, default: null },
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

supportConversationSchema.index({ status: 1, lastMessageAt: -1 });

export const SupportConversation =
  (mongoose.models.SupportConversation as mongoose.Model<ISupportConversation>) ??
  mongoose.model<ISupportConversation>(
    "SupportConversation",
    supportConversationSchema,
  );

export interface ISupportAttachment {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export interface ISupportMessage extends Document {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  senderType: SupportMessageSenderType;
  senderUser?: Types.ObjectId | null;
  body: string;
  attachments?: ISupportAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "SupportConversation",
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: SUPPORT_MESSAGE_SENDER_TYPES,
      required: true,
    },
    senderUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    body: { type: String, default: "" },
    attachments: {
      type: [
        {
          _id: false,
          fileName: { type: String, required: true },
          fileType: { type: String, required: true },
          fileSize: { type: Number, required: true },
          fileUrl: { type: String, required: true },
        },
      ],
      default: [],
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

supportMessageSchema.index({ conversation: 1, createdAt: 1 });

export const SupportMessage =
  (mongoose.models.SupportMessage as mongoose.Model<ISupportMessage>) ??
  mongoose.model<ISupportMessage>("SupportMessage", supportMessageSchema);
