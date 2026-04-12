import { Router } from "express";

import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  addNoteHandler,
  createFeedbackHandler,
  deleteFeedbackHandler,
  getFeedbackHandler,
  listFeedbackHandler,
} from "./feedback.controller";
import {
  addNoteSchema,
  createFeedbackSchema,
  feedbackIdParamSchema,
  listFeedbackQuerySchema,
} from "./feedback.validation";

const router = Router();

router.use(authenticate);

router.post("/", validate(createFeedbackSchema), createFeedbackHandler);

router.get(
  "/",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(listFeedbackQuerySchema, "query"),
  listFeedbackHandler,
);

router.get(
  "/:id",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(feedbackIdParamSchema, "params"),
  getFeedbackHandler,
);

router.patch(
  "/:id/note",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(feedbackIdParamSchema, "params"),
  validate(addNoteSchema),
  addNoteHandler,
);

router.delete(
  "/:id",
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(feedbackIdParamSchema, "params"),
  deleteFeedbackHandler,
);

export default router;
