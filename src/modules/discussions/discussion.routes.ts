import { Router } from "express";
import { validate } from "@/middleware/validate";
import {
  listDiscussionsQuerySchema,
  createDiscussionSchema,
  discussionCourseParamsSchema,
  discussionThreadParamsSchema,
  createReplySchema,
  threadRepliesQuerySchema,
} from "./discussion.validation";
import {
  listDiscussionsHandler,
  createDiscussionHandler,
  getDiscussionThreadHandler,
  createDiscussionReplyHandler,
} from "./discussion.controller";
import { authorize } from "@/middleware/auth.middleware";
import { USER_ROLES } from "../users/user.model";

const router = Router({ mergeParams: true });

router.get(
  "/course/:id",
  authorize(USER_ROLES[0], USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(discussionCourseParamsSchema, "params"),
  validate(listDiscussionsQuerySchema, "query"),
  listDiscussionsHandler,
);
router.post(
  "/course/:id",
  authorize(USER_ROLES[0], USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(discussionCourseParamsSchema, "params"),
  validate(createDiscussionSchema),
  createDiscussionHandler,
);
router.post(
  "/:threadId/replies",
  authorize(USER_ROLES[0], USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(discussionThreadParamsSchema, "params"),
  validate(createReplySchema),
  createDiscussionReplyHandler,
);
router.get(
  "/:threadId",
  authorize(USER_ROLES[0], USER_ROLES[1], USER_ROLES[2], USER_ROLES[3]) as any,
  validate(discussionThreadParamsSchema, "params"),
  validate(threadRepliesQuerySchema, "query"),
  getDiscussionThreadHandler,
);

export default router;
