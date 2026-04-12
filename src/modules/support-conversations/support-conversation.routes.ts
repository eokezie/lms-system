import { Router } from "express";

import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { processSupportFile } from "@/middleware/multer.middleware";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  claimConversationHandler,
  closeConversationHandler,
  ensureMyConversationHandler,
  getAgentStatsHandler,
  getConversationHandler,
  listAgentConversationsHandler,
  listConversationMessagesHandler,
  listMyConversationsHandler,
  sendAgentMessageHandler,
  sendUserMessageHandler,
  uploadConversationAttachmentHandler,
} from "./support-conversation.controller";
import {
  conversationIdParamSchema,
  listAgentConversationsQuerySchema,
  sendMessageSchema,
} from "./support-conversation.validation";

const router = Router();

router.use(authenticate);

router.get("/me", listMyConversationsHandler);
router.post("/me/ensure", ensureMyConversationHandler);
router.post(
  "/:id/messages",
  validate(conversationIdParamSchema, "params"),
  validate(sendMessageSchema),
  sendUserMessageHandler,
);
router.post(
  "/:id/uploads",
  validate(conversationIdParamSchema, "params"),
  processSupportFile,
  uploadConversationAttachmentHandler,
);

router.get(
  "/:id",
  validate(conversationIdParamSchema, "params"),
  getConversationHandler,
);
router.get(
  "/:id/messages",
  validate(conversationIdParamSchema, "params"),
  listConversationMessagesHandler,
);
router.post(
  "/:id/close",
  validate(conversationIdParamSchema, "params"),
  closeConversationHandler,
);

router.get(
  "/",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(listAgentConversationsQuerySchema, "query"),
  listAgentConversationsHandler,
);
router.get(
  "/agent/stats",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  getAgentStatsHandler,
);
router.post(
  "/:id/claim",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(conversationIdParamSchema, "params"),
  claimConversationHandler,
);
router.post(
  "/:id/agent-messages",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(conversationIdParamSchema, "params"),
  validate(sendMessageSchema),
  sendAgentMessageHandler,
);

export default router;
