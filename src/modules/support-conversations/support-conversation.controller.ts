import { Request, Response } from "express";

import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import { ApiError } from "@/utils/apiError";
import {
  claimConversationService,
  closeConversationService,
  ensureUserConversationService,
  getConversationByIdService,
  getConversationStatsService,
  listConversationsForAgentService,
  listMessagesService,
  listMyConversationsService,
  sendAgentMessageService,
  sendUserMessageService,
  uploadConversationAttachmentService,
} from "./support-conversation.service";
import {
  conversationIdParamSchema,
  listAgentConversationsQuerySchema,
  listMessagesQuerySchema,
  sendMessageSchema,
  type ListAgentConversationsQuery,
} from "./support-conversation.validation";

export const ensureMyConversationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const conversation = await ensureUserConversationService(userId);
    sendCreated({
      res,
      message: "Conversation ready",
      data: conversation,
    });
  },
);

export const listMyConversationsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const conversations = await listMyConversationsService(userId);
    sendSuccess({
      res,
      message: "Conversations fetched successfully",
      data: conversations,
    });
  },
);

export const getConversationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = conversationIdParamSchema.parse(req.params);
    const conversation = await getConversationByIdService(id);
    sendSuccess({
      res,
      message: "Conversation fetched successfully",
      data: conversation,
    });
  },
);

export const listConversationMessagesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = conversationIdParamSchema.parse(req.params);
    const { after } = listMessagesQuerySchema.parse(req.query);
    const messages = await listMessagesService(id, {
      after: after ? new Date(after) : null,
    });
    sendSuccess({
      res,
      message: "Messages fetched successfully",
      data: messages,
    });
  },
);

export const sendUserMessageHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = conversationIdParamSchema.parse(req.params);
    const { body, attachments } = sendMessageSchema.parse(req.body);
    const userId = req.user!.userId;
    const result = await sendUserMessageService({
      conversationId: id,
      userId,
      body,
      attachments,
    });
    sendCreated({
      res,
      message: "Message sent",
      data: result,
    });
  },
);

export const sendAgentMessageHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = conversationIdParamSchema.parse(req.params);
    const { body, attachments } = sendMessageSchema.parse(req.body);
    const agentId = req.user!.userId;
    const message = await sendAgentMessageService({
      conversationId: id,
      agentId,
      body,
      attachments,
    });
    sendCreated({
      res,
      message: "Message sent",
      data: message,
    });
  },
);

export const uploadConversationAttachmentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = conversationIdParamSchema.parse(req.params);
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest("No file uploaded");
    }
    const attachment = await uploadConversationAttachmentService({
      conversationId: id,
      userId: req.user!.userId,
      role: req.user!.role,
      file,
    });
    sendCreated({
      res,
      message: "File uploaded",
      data: attachment,
    });
  },
);

export const claimConversationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = conversationIdParamSchema.parse(req.params);
    const agentId = req.user!.userId;
    const conversation = await claimConversationService(id, agentId);
    sendSuccess({
      res,
      message: "Conversation claimed",
      data: conversation,
    });
  },
);

export const closeConversationHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = conversationIdParamSchema.parse(req.params);
    const userId = req.user!.userId;
    const conversation = await closeConversationService(id, userId);
    sendSuccess({
      res,
      message: "Conversation closed",
      data: conversation,
    });
  },
);

export const listAgentConversationsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = listAgentConversationsQuerySchema.parse(
      req.query,
    ) as ListAgentConversationsQuery;
    const agentId = req.user!.userId;
    const result = await listConversationsForAgentService({
      page: query.page,
      limit: query.limit,
      status: query.status as any,
      search: query.search,
      assignedAgentId: agentId,
    });
    sendSuccess({
      res,
      message: "Conversations fetched successfully",
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const getAgentStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await getConversationStatsService();
    sendSuccess({
      res,
      message: "Stats fetched successfully",
      data,
    });
  },
);
