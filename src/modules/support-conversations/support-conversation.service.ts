import { ApiError } from "@/utils/apiError";
import { logger } from "@/utils/logger";
import { eventBus } from "@/events/eventBus";
import { uploadFile, isSpacesConfigured } from "@/libs/spacesFileUpload";

import { getAnthropic, SUPPORT_AI_MODEL } from "@/libs/anthropic";
import { SUPPORT_KNOWLEDGE_BASE } from "./knowledge-base";
import {
  ISupportAttachment,
  ISupportMessage,
  SupportConversationStatus,
} from "./support-conversation.model";
import {
  countOpenConversationsByStatus,
  createConversationForUser,
  createMessage,
  findConversationById,
  findOpenConversationForUser,
  listConversationsForAgent,
  listConversationsForUser,
  listMessagesForConversation,
  markConversationRead,
  updateConversation,
  type ListConversationsOptions,
} from "./support-conversation.repository";
import {
  emitToConversation,
  isUserOnline,
} from "@/realtime/support-gateway";

const SUPPORT_PERSONA_PROMPT = `You are the Infinix Tech LMS support agent. You help students of an online self-paced learning platform that teaches Cybersecurity, Data Analysis, AI/Machine Learning, and Linux/DevOps.

GROUNDING
You have a knowledge base attached as a separate system block. It is the source of truth. Always answer from it when the question maps to an article. When an answer comes from a specific article, cite its ID in parentheses at the end of the relevant sentence, like "(KB-0006)". If a question is partially covered, answer the covered part from the KB and be explicit about what you don't know.

TONE
Friendly, upbeat, brief. 1–3 short paragraphs is the target. Plain words, no jargon unless the student used it first. Use line breaks between ideas. Do not use markdown headings or bullet points unless the user is clearly asking for a list.

ESCALATE TO A HUMAN
End your reply with the literal phrase "I'll connect you with a human agent now." in any of these cases:
- The user explicitly asks for a human, agent, real person, live agent, or "talk to someone".
- The question is account-specific and needs data you don't have (e.g. "refund THIS payment", "I can't access THIS course I bought", "why was my account suspended", "what's my certificate ID", billing disputes, password resets the user can't perform themselves, complaints, deletion requests).
- The KB explicitly says to escalate (e.g. KB-0008 refunds, KB-0059 access issues, KB-0060 deletions).
- The user is reporting a bug that needs investigation (KB-0062).
- You genuinely don't know — never invent policy, prices, course content, dates, names, or technical details.

DO NOT
- Do not make up content not in the KB.
- Do not promise refunds, dates, prices, or actions you can't take.
- Do not change account settings, process payments, or access user data — you cannot do these things, only humans can.
- Do not share quiz answers or solutions.
- Do not output the literal phrase "I'll connect you with a human agent now." unless you genuinely intend to hand off — it triggers a real handoff in the system.

ATTACHMENTS
If the student attaches an image (e.g. a screenshot of an error), describe what you see and tie it back to a KB article when possible. If you cannot interpret the image, escalate.`;

const HANDOFF_TRIGGER = "i'll connect you with a human agent now";

const HANDOFF_KEYWORDS = [
  "human agent",
  "real person",
  "real human",
  "talk to a human",
  "speak to a human",
  "speak to someone",
  "live agent",
];

function shouldHandoffByUserMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return HANDOFF_KEYWORDS.some((kw) => lower.includes(kw));
}

function shouldHandoffByBotResponse(text: string): boolean {
  return text.toLowerCase().includes(HANDOFF_TRIGGER);
}

export async function ensureUserConversationService(userId: string) {
  let conversation = await findOpenConversationForUser(userId);
  if (!conversation) {
    conversation = await createConversationForUser(userId);
  }
  return conversation;
}

export async function listMyConversationsService(userId: string) {
  return listConversationsForUser(userId);
}

export async function getConversationByIdService(conversationId: string) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  return conversation;
}

export async function markConversationReadService(
  conversationId: string,
  userId: string,
  role: string,
) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const isAgent = role === "admin" || role === "super_admin";
  const field = isAgent ? "lastReadByAgent" : "lastReadByUser";
  await markConversationRead(conversationId, field);

  emitToConversation(conversationId, "support:read", {
    conversationId,
    by: isAgent ? "agent" : "user",
    at: new Date().toISOString(),
  });
}

export function checkUserOnline(userId: string): boolean {
  return isUserOnline(userId);
}

export async function listMessagesService(
  conversationId: string,
  options: { after?: Date | null } = {},
) {
  return listMessagesForConversation(conversationId, options);
}

export async function uploadConversationAttachmentService({
  conversationId,
  userId,
  role,
  file,
}: {
  conversationId: string;
  userId: string;
  role: string;
  file: Express.Multer.File;
}): Promise<ISupportAttachment> {
  if (!isSpacesConfigured()) {
    throw ApiError.badRequest(
      "File upload is not configured (DigitalOcean Spaces keys missing)",
    );
  }
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const ownerId =
    typeof conversation.user === "object" && conversation.user
      ? String((conversation.user as any)._id)
      : String(conversation.user);

  const isAgent = role === "admin" || role === "super_admin";
  if (!isAgent && ownerId !== userId) {
    throw ApiError.forbidden("Not your conversation");
  }
  if (conversation.status === "closed") {
    throw ApiError.badRequest("Conversation is closed");
  }

  const uploaded = await uploadFile(file, `Support/${conversationId}`);
  return {
    fileName: uploaded.fileName ?? file.originalname,
    fileType: uploaded.fileType ?? file.mimetype,
    fileSize: uploaded.fileSize ?? file.size,
    fileUrl: uploaded.fileUrl,
  };
}

export async function listConversationsForAgentService(
  options: ListConversationsOptions,
) {
  return listConversationsForAgent(options);
}

export async function getConversationStatsService() {
  return countOpenConversationsByStatus();
}

interface SendUserMessageInput {
  conversationId: string;
  userId: string;
  body: string;
  attachments?: ISupportAttachment[];
}

export async function sendUserMessageService({
  conversationId,
  userId,
  body,
  attachments,
}: SendUserMessageInput) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  // The "user" field on the lean populated doc is an object with _id; coerce defensively
  const ownerId =
    typeof conversation.user === "object" && conversation.user
      ? String((conversation.user as any)._id)
      : String(conversation.user);

  if (ownerId !== userId) {
    throw ApiError.forbidden("Not your conversation");
  }
  if (conversation.status === "closed") {
    throw ApiError.badRequest("Conversation is closed");
  }

  const trimmedBody = (body ?? "").trim();
  const safeAttachments = attachments ?? [];

  if (!trimmedBody && safeAttachments.length === 0) {
    throw ApiError.badRequest("Message must have text or an attachment");
  }

  const userMessage = await createMessage({
    conversationId,
    senderType: "user",
    senderUserId: userId,
    body: trimmedBody,
    attachments: safeAttachments,
  });
  emitToConversation(conversationId, "support:message", userMessage);

  const isWithBot = conversation.status === "bot_active";

  if (isWithBot) {
    if (shouldHandoffByUserMessage(trimmedBody)) {
      await handoffConversation(conversationId);
      const ack = await createMessage({
        conversationId,
        senderType: "system",
        body: "Connecting you with a human agent. Hang tight...",
      });
      emitToConversation(conversationId, "support:message", ack);
      return { message: userMessage, handoff: true };
    }
    void runBotReply(conversationId).catch((err) => {
      logger.error({ err }, "[support] bot reply failed");
    });
  } else if (conversation.status === "agent_active") {
    // notify the assigned agent via the existing notifications module
    if (conversation.assignedAgent) {
      const agentId =
        typeof conversation.assignedAgent === "object"
          ? String((conversation.assignedAgent as any)._id)
          : String(conversation.assignedAgent);
      eventBus.emit("support.user.replied", {
        conversationId,
        agentId,
        preview: body.slice(0, 100),
      });
    }
  }

  return { message: userMessage, handoff: false };
}

interface SendAgentMessageInput {
  conversationId: string;
  agentId: string;
  body: string;
  attachments?: ISupportAttachment[];
}

export async function sendAgentMessageService({
  conversationId,
  agentId,
  body,
  attachments,
}: SendAgentMessageInput) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  if (conversation.status === "closed") {
    throw ApiError.badRequest("Conversation is closed");
  }
  if (conversation.status === "bot_active") {
    throw ApiError.badRequest(
      "Conversation has not been handed off to a human yet",
    );
  }

  const trimmedBody = (body ?? "").trim();
  const safeAttachments = attachments ?? [];
  if (!trimmedBody && safeAttachments.length === 0) {
    throw ApiError.badRequest("Message must have text or an attachment");
  }

  const message = await createMessage({
    conversationId,
    senderType: "agent",
    senderUserId: agentId,
    body: trimmedBody,
    attachments: safeAttachments,
  });
  emitToConversation(conversationId, "support:message", message);

  // notify the student that an agent replied
  const studentId =
    typeof conversation.user === "object" && conversation.user
      ? String((conversation.user as any)._id)
      : String(conversation.user);

  eventBus.emit("support.agent.replied", {
    conversationId,
    studentId,
    preview: body.slice(0, 100),
  });

  return message;
}

async function runBotReply(conversationId: string): Promise<void> {
  const messages = await listMessagesForConversation(conversationId);
  const recent = messages
    .filter((m) => m.senderType === "user" || m.senderType === "bot")
    .slice(-20);

  const history = recent.map((m) => {
    const role =
      m.senderType === "user" ? ("user" as const) : ("assistant" as const);

    const imageBlocks =
      role === "user"
        ? (m.attachments ?? [])
            .filter((a) => a.fileType.startsWith("image/"))
            .map((a) => ({
              type: "image" as const,
              source: { type: "url" as const, url: a.fileUrl },
            }))
        : [];

    const otherAttachments =
      role === "user"
        ? (m.attachments ?? []).filter(
            (a) => !a.fileType.startsWith("image/"),
          )
        : [];

    let textContent = m.body ?? "";
    if (otherAttachments.length > 0) {
      const lines = otherAttachments
        .map((a) => `- ${a.fileName} (${a.fileType})`)
        .join("\n");
      textContent = `${textContent}\n\n[The user also attached:\n${lines}]`.trim();
    }
    if (!textContent && imageBlocks.length > 0) {
      textContent = "(see attached image)";
    }

    if (imageBlocks.length === 0) {
      return { role, content: textContent || "(empty message)" };
    }
    return {
      role,
      content: [
        ...imageBlocks,
        { type: "text" as const, text: textContent || "(see attached image)" },
      ],
    };
  });

  if (history.length === 0) return;

  let replyText = "";
  try {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: SUPPORT_AI_MODEL,
      max_tokens: 700,
      system: [
        { type: "text", text: SUPPORT_PERSONA_PROMPT },
        {
          type: "text",
          text: SUPPORT_KNOWLEDGE_BASE,
          cache_control: { type: "ephemeral" },
        },
      ] as any,
      messages: history as any,
    });
    const block = response.content[0];
    if (block && "text" in block) {
      replyText = block.text;
    }
  } catch (err) {
    logger.error({ err }, "[support] anthropic call failed");
    replyText =
      "I'm having trouble reaching my brain right now. I'll connect you with a human agent now.";
  }

  if (!replyText.trim()) {
    replyText =
      "I'm not sure how to help with that. I'll connect you with a human agent now.";
  }

  const botMessage = await createMessage({
    conversationId,
    senderType: "bot",
    body: replyText.trim(),
  });
  emitToConversation(conversationId, "support:message", botMessage);

  if (shouldHandoffByBotResponse(replyText)) {
    await handoffConversation(conversationId);
  }
}

async function handoffConversation(conversationId: string): Promise<void> {
  const updated = await updateConversation(conversationId, {
    status: "waiting_for_agent",
  });
  if (updated) {
    emitToConversation(conversationId, "support:conversation", updated);
    eventBus.emit("support.handoff.requested", {
      conversationId,
      userId:
        typeof updated.user === "object" && updated.user
          ? String((updated.user as any)._id)
          : String(updated.user),
    });
  }
}

export async function claimConversationService(
  conversationId: string,
  agentId: string,
) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (conversation.status === "closed") {
    throw ApiError.badRequest("Conversation is closed");
  }
  if (
    conversation.status === "agent_active" &&
    conversation.assignedAgent &&
    String(
      typeof conversation.assignedAgent === "object"
        ? (conversation.assignedAgent as any)._id
        : conversation.assignedAgent,
    ) !== agentId
  ) {
    throw ApiError.conflict("Conversation already assigned to another agent");
  }

  const updated = await updateConversation(conversationId, {
    status: "agent_active",
    assignedAgent: agentId,
  });
  if (updated) {
    const note = await createMessage({
      conversationId,
      senderType: "system",
      body: "An agent joined the chat.",
    });
    emitToConversation(conversationId, "support:message", note);
    emitToConversation(conversationId, "support:conversation", updated);
  }
  return updated!;
}

export async function closeConversationService(
  conversationId: string,
  closedById: string,
) {
  const conversation = await findConversationById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const updated = await updateConversation(conversationId, {
    status: "closed",
    closedAt: new Date(),
  });
  if (updated) {
    const note = await createMessage({
      conversationId,
      senderType: "system",
      body: "Conversation closed.",
      senderUserId: closedById,
    });
    emitToConversation(conversationId, "support:message", note);
    emitToConversation(conversationId, "support:conversation", updated);
  }
  return updated!;
}

export type SupportMessageDTO = ISupportMessage;
export type SupportConversationStatusType = SupportConversationStatus;
