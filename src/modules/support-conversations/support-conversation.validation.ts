import { z } from "zod";

import { SUPPORT_CONVERSATION_STATUSES } from "./support-conversation.model";

export const conversationIdParamSchema = z.object({
  id: z.string().length(24, "Invalid conversation id"),
});

const attachmentSchema = z.object({
  fileName: z.string().min(1).max(300),
  fileType: z.string().min(1).max(120),
  fileSize: z.number().int().min(0),
  fileUrl: z.string().url(),
});

export const sendMessageSchema = z
  .object({
    body: z.string().trim().max(8000).optional().default(""),
    attachments: z.array(attachmentSchema).max(10).optional().default([]),
  })
  .refine(
    (v) =>
      (v.body && v.body.trim().length > 0) ||
      (v.attachments && v.attachments.length > 0),
    { message: "Message must have text or an attachment", path: ["body"] },
  );

export const listMessagesQuerySchema = z.object({
  after: z.string().datetime().optional(),
});

export const listAgentConversationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z
    .enum([...SUPPORT_CONVERSATION_STATUSES, "all", "assigned_to_me"])
    .optional()
    .default("all"),
  search: z.string().trim().max(120).optional(),
});

export type ListAgentConversationsQuery = z.infer<
  typeof listAgentConversationsQuerySchema
>;
