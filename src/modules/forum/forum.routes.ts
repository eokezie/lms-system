import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  listTopics,
  createTopic,
  editTopic,
  deleteTopic,
  listPosts,
  getPost,
  createPost,
  editPost,
  deletePost,
  viewPost,
  listReplies,
  createReply,
  editReply,
  deleteReply,
  getPostNotes,
  addPostNote,
  deletePostNote,
  getReplyNotes,
  addReplyNote,
  deleteReplyNote,
  flagPost,
  flagReply,
  getPostFlags,
  getReplyFlags,
  resolveFlag,
  listGuidelines,
  createGuideline,
  editGuideline,
  deleteGuideline,
  getTopContributors,
  getModerationLogs,
  listUserAccess,
  updateUserAccess,
} from "./forum.controller";
import {
  createTopicSchema,
  editTopicSchema,
  listPostsQuerySchema,
  createPostSchema,
  editPostSchema,
  paginationQuerySchema,
  createReplySchema,
  editReplySchema,
  createNoteSchema,
  createFlagSchema,
  resolveFlagSchema,
  createGuidelineSchema,
  editGuidelineSchema,
  contributorsQuerySchema,
  moderationLogQuerySchema,
  updateUserAccessSchema,
} from "./forum.validation";

const router = Router();
router.use(authenticate);

router.get("/topics", listTopics);

router.post(
  "/topics",
  authorize("admin", "super_admin"),
  validate(createTopicSchema),
  createTopic,
);

router.patch(
  "/topics/:topicId",
  authorize("admin", "super_admin"),
  validate(editTopicSchema),
  editTopic,
);

router.delete(
  "/topics/:topicId",
  authorize("admin", "super_admin"),
  deleteTopic,
);

router.get("/posts", validate(listPostsQuerySchema, "query"), listPosts);

router.get("/posts/:postId", getPost);

router.post("/posts", validate(createPostSchema), createPost);

router.patch("/posts/:postId", validate(editPostSchema), editPost);

router.delete("/posts/:postId", deletePost);

router.post("/posts/:postId/view", viewPost);


router.get(
  "/posts/:postId/replies",
  validate(paginationQuerySchema, "query"),
  listReplies,
);

router.post(
  "/posts/:postId/replies",
  validate(createReplySchema),
  createReply,
);

router.patch(
  "/posts/:postId/replies/:replyId",
  validate(editReplySchema),
  editReply,
);

router.delete("/posts/:postId/replies/:replyId", deleteReply);

router.get(
  "/posts/:postId/notes",
  authorize("admin", "super_admin"),
  getPostNotes,
);

router.post(
  "/posts/:postId/notes",
  authorize("admin", "super_admin"),
  validate(createNoteSchema),
  addPostNote,
);

router.delete(
  "/posts/:postId/notes/:noteId",
  authorize("admin", "super_admin"),
  deletePostNote,
);

router.get(
  "/posts/:postId/replies/:replyId/notes",
  authorize("admin", "super_admin"),
  getReplyNotes,
);

router.post(
  "/posts/:postId/replies/:replyId/notes",
  authorize("admin", "super_admin"),
  validate(createNoteSchema),
  addReplyNote,
);

router.delete(
  "/posts/:postId/replies/:replyId/notes/:noteId",
  authorize("admin", "super_admin"),
  deleteReplyNote,
);

router.post("/posts/:postId/flag", validate(createFlagSchema), flagPost);

router.post(
  "/posts/:postId/replies/:replyId/flag",
  validate(createFlagSchema),
  flagReply,
);

router.get(
  "/posts/:postId/flags",
  authorize("admin", "super_admin"),
  getPostFlags,
);

router.get(
  "/posts/:postId/replies/:replyId/flags",
  authorize("admin", "super_admin"),
  getReplyFlags,
);

router.patch(
  "/flags/:flagId",
  authorize("admin", "super_admin"),
  validate(resolveFlagSchema),
  resolveFlag,
);

router.get("/guidelines", listGuidelines);

router.post(
  "/guidelines",
  authorize("admin", "super_admin"),
  validate(createGuidelineSchema),
  createGuideline,
);

router.patch(
  "/guidelines/:guidelineId",
  authorize("admin", "super_admin"),
  validate(editGuidelineSchema),
  editGuideline,
);

router.delete(
  "/guidelines/:guidelineId",
  authorize("admin", "super_admin"),
  deleteGuideline,
);

router.get(
  "/contributors",
  validate(contributorsQuerySchema, "query"),
  getTopContributors,
);

router.get(
  "/moderation-activities",
  authorize("admin", "super_admin"),
  validate(moderationLogQuerySchema, "query"),
  getModerationLogs,
);

router.get(
  "/access",
  authorize("admin", "super_admin"),
  validate(paginationQuerySchema, "query"),
  listUserAccess,
);

router.patch(
  "/access/:userId",
  authorize("admin", "super_admin"),
  validate(updateUserAccessSchema),
  updateUserAccess,
);

export default router;
