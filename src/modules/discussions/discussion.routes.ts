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

const router = Router({ mergeParams: true });

router.get(
  "/course/:id",
  validate(discussionCourseParamsSchema, "params"),
  validate(listDiscussionsQuerySchema, "query"),
  listDiscussionsHandler,
);
router.post(
  "/course/:id",
  validate(discussionCourseParamsSchema, "params"),
  validate(createDiscussionSchema),
  createDiscussionHandler,
);
router.post(
  "/:threadId/replies",
  validate(discussionThreadParamsSchema, "params"),
  validate(createReplySchema),
  createDiscussionReplyHandler,
);
router.get(
  "/:threadId",
  validate(discussionThreadParamsSchema, "params"),
  validate(threadRepliesQuerySchema, "query"),
  getDiscussionThreadHandler,
);

export default router;
