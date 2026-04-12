import mongoose from "mongoose";

import {
  ISupportAttachment,
  ISupportConversation,
  ISupportMessage,
  SupportConversation,
  SupportConversationStatus,
  SupportMessage,
  SupportMessageSenderType,
} from "./support-conversation.model";

export async function createConversationForUser(
  userId: string,
): Promise<ISupportConversation> {
  return SupportConversation.create({
    user: new mongoose.Types.ObjectId(userId),
    status: "bot_active",
    lastMessageAt: new Date(),
  });
}

export async function findConversationById(
  id: string,
): Promise<ISupportConversation | null> {
  return SupportConversation.findById(id)
    .populate("user", "firstName lastName email avatar")
    .populate("assignedAgent", "firstName lastName email avatar")
    .lean()
    .exec() as Promise<ISupportConversation | null>;
}

export async function findOpenConversationForUser(
  userId: string,
): Promise<ISupportConversation | null> {
  return SupportConversation.findOne({
    user: new mongoose.Types.ObjectId(userId),
    status: { $ne: "closed" },
  })
    .sort({ lastMessageAt: -1 })
    .lean()
    .exec() as Promise<ISupportConversation | null>;
}

export interface ListConversationsOptions {
  status?: SupportConversationStatus | "all" | "assigned_to_me";
  assignedAgentId?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function listConversationsForAgent(
  options: ListConversationsOptions,
) {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (options.status === "assigned_to_me" && options.assignedAgentId) {
    filter.assignedAgent = new mongoose.Types.ObjectId(options.assignedAgentId);
  } else if (options.status && options.status !== "all") {
    filter.status = options.status;
  }
  if (options.search?.trim()) {
    filter.lastMessagePreview = {
      $regex: options.search.trim(),
      $options: "i",
    };
  }

  const [items, total] = await Promise.all([
    SupportConversation.find(filter)
      .populate("user", "firstName lastName email avatar")
      .populate("assignedAgent", "firstName lastName email avatar")
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    SupportConversation.countDocuments(filter),
  ]);

  return {
    items: items as unknown as ISupportConversation[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function listConversationsForUser(
  userId: string,
): Promise<ISupportConversation[]> {
  const items = await SupportConversation.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .sort({ lastMessageAt: -1 })
    .populate("assignedAgent", "firstName lastName avatar")
    .lean()
    .exec();
  return items as unknown as ISupportConversation[];
}

export async function listMessagesForConversation(
  conversationId: string,
  options: { after?: Date | null } = {},
): Promise<ISupportMessage[]> {
  const filter: Record<string, unknown> = {
    conversation: new mongoose.Types.ObjectId(conversationId),
  };
  if (options.after instanceof Date && !Number.isNaN(options.after.getTime())) {
    filter.createdAt = { $gt: options.after };
  }
  const items = await SupportMessage.find(filter)
    .sort({ createdAt: 1 })
    .populate("senderUser", "firstName lastName avatar role")
    .lean()
    .exec();
  return items as unknown as ISupportMessage[];
}

export interface CreateMessageInput {
  conversationId: string;
  senderType: SupportMessageSenderType;
  senderUserId?: string | null;
  body: string;
  attachments?: ISupportAttachment[];
}

export async function createMessage(
  input: CreateMessageInput,
): Promise<ISupportMessage> {
  const attachments = input.attachments ?? [];
  const message = await SupportMessage.create({
    conversation: new mongoose.Types.ObjectId(input.conversationId),
    senderType: input.senderType,
    senderUser: input.senderUserId
      ? new mongoose.Types.ObjectId(input.senderUserId)
      : null,
    body: input.body,
    attachments,
  });

  const previewBase = input.body.trim()
    ? input.body
    : attachments.length > 0
      ? `📎 ${attachments[0].fileName}${
          attachments.length > 1 ? ` (+${attachments.length - 1})` : ""
        }`
      : "";

  await SupportConversation.updateOne(
    { _id: new mongoose.Types.ObjectId(input.conversationId) },
    {
      $set: {
        lastMessageAt: new Date(),
        lastMessagePreview: previewBase.slice(0, 200),
      },
    },
  ).exec();

  const populated = await SupportMessage.findById(message._id)
    .populate("senderUser", "firstName lastName avatar role")
    .lean()
    .exec();
  return populated as unknown as ISupportMessage;
}

export async function updateConversation(
  id: string,
  patch: Partial<{
    status: SupportConversationStatus;
    assignedAgent: string | null;
    closedAt: Date | null;
  }>,
): Promise<ISupportConversation | null> {
  const update: Record<string, unknown> = {};
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.assignedAgent !== undefined) {
    update.assignedAgent = patch.assignedAgent
      ? new mongoose.Types.ObjectId(patch.assignedAgent)
      : null;
  }
  if (patch.closedAt !== undefined) update.closedAt = patch.closedAt;

  const doc = await SupportConversation.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true },
  )
    .populate("user", "firstName lastName email avatar")
    .populate("assignedAgent", "firstName lastName email avatar")
    .lean()
    .exec();
  return doc as unknown as ISupportConversation | null;
}

export async function countOpenConversationsByStatus() {
  const grouped = await SupportConversation.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]).exec();
  const result: Record<SupportConversationStatus, number> = {
    bot_active: 0,
    waiting_for_agent: 0,
    agent_active: 0,
    closed: 0,
  };
  for (const row of grouped) {
    if (row._id in result) {
      result[row._id as SupportConversationStatus] = row.count;
    }
  }
  return result;
}
