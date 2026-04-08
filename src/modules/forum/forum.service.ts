import { ApiError } from "@/utils/apiError";
import {
  findAllTopics,
  findTopicById,
  createTopic,
  updateTopicName,
  deleteTopic as deleteTopicRepo,
  incrementTopicPostCount,
  findPostsPaginated,
  findPostById,
  createPost,
  updatePostContent,
  softDeletePost,
  incrementPostViewCount,
  incrementPostReplyCount,
  markPostFlagged,
  findRepliesByPost,
  findReplyById,
  createReply,
  updateReplyContent,
  softDeleteReply,
  markReplyFlagged,
  findNotes,
  createNote,
  deleteNote,
  findNoteById,
  findFlagByReporterAndTarget,
  createFlag,
  findFlagsByTarget,
  findFlagById,
  resolveFlag as resolveFlagRepo,
  countPendingFlagsByTarget,
  findAllGuidelines,
  createGuideline,
  updateGuideline,
  deleteGuideline as deleteGuidelineRepo,
  findGuidelineById,
  findTopContributors,
  createModerationLog,
  findModerationLogsPaginated,
  findForumUserAccessPaginated,
  upsertForumUserAccess,
  PostListOptions,
  ModerationLogOptions,
} from "./forum.repository";
import { ModerationActionType, ForumNoteTargetType } from "./forum.models";

async function logModeration(
  actor: string,
  actionType: ModerationActionType,
  targetType?: string,
  targetId?: string,
  details?: string,
) {
  await createModerationLog({
    actor,
    actionType,
    targetType,
    targetId,
    details,
  });
}

export async function listTopics() {
  return findAllTopics();
}

export async function createTopicService(name: string, adminId: string) {
  const topic = await createTopic(name);
  await logModeration(
    adminId,
    "topic_created",
    "topic",
    topic._id.toString(),
    `Created topic "${name}"`,
  );
  return topic;
}

export async function updateTopicService(
  topicId: string,
  name: string,
  adminId: string,
) {
  const topic = await findTopicById(topicId);
  if (!topic) throw ApiError.notFound("Topic not found");
  const updated = await updateTopicName(topicId, name);
  await logModeration(
    adminId,
    "topic_edited",
    "topic",
    topicId,
    `Renamed topic to "${name}"`,
  );
  return updated;
}

export async function deleteTopicService(topicId: string, adminId: string) {
  const topic = await findTopicById(topicId);
  if (!topic) throw ApiError.notFound("Topic not found");
  await deleteTopicRepo(topicId);
  await logModeration(
    adminId,
    "topic_deleted",
    "topic",
    topicId,
    `Deleted topic "${topic.name}"`,
  );
}

export async function listPosts(opts: PostListOptions) {
  return findPostsPaginated(opts);
}

export async function getPostDetail(postId: string) {
  const post = await findPostById(postId);
  if (!post) throw ApiError.notFound("Post not found");
  return post;
}

export async function createPostService(data: {
  topicId: string;
  title: string;
  content: string;
  authorId: string;
}) {
  const topic = await findTopicById(data.topicId);
  if (!topic) throw ApiError.notFound("Topic not found");

  const post = await createPost({
    topic: data.topicId,
    author: data.authorId,
    title: data.title,
    content: data.content,
  });
  await incrementTopicPostCount(data.topicId, 1);
  return post;
}

export async function editPostService(
  postId: string,
  content: string,
  userId: string,
) {
  const post = await findPostById(postId);
  if (!post) throw ApiError.notFound("Post not found");
  if (
    String((post as any).author?._id ?? (post as any).author) !== userId
  ) {
    throw ApiError.forbidden("You can only edit your own posts");
  }
  return updatePostContent(postId, content);
}

export async function deletePostService(
  postId: string,
  userId: string,
  userRole: string,
) {
  const post = await findPostById(postId);
  if (!post) throw ApiError.notFound("Post not found");

  const isOwner =
    String((post as any).author?._id ?? (post as any).author) === userId;
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden(
      "You do not have permission to delete this post",
    );
  }

  await softDeletePost(postId);
  await incrementTopicPostCount(String(post.topic), -1);

  if (isAdmin) {
    await logModeration(
      userId,
      "post_deleted",
      "post",
      postId,
      `Deleted post "${post.title}"`,
    );
  }
}

export async function incrementViewCount(postId: string) {
  await incrementPostViewCount(postId);
}

export async function listReplies(
  postId: string,
  page: number,
  limit: number,
) {
  const post = await findPostById(postId);
  if (!post) throw ApiError.notFound("Post not found");
  return findRepliesByPost(postId, page, limit);
}

export async function createReplyService(data: {
  postId: string;
  authorId: string;
  content: string;
  attachments?: string[];
  authorRole: string;
}) {
  const post = await findPostById(data.postId);
  if (!post) throw ApiError.notFound("Post not found");

  const reply = await createReply({
    post: data.postId,
    author: data.authorId,
    content: data.content,
    attachments: data.attachments,
  });
  await incrementPostReplyCount(data.postId, 1);

  const isAdmin =
    data.authorRole === "admin" || data.authorRole === "super_admin";
  if (isAdmin) {
    await logModeration(
      data.authorId,
      "admin_replied",
      "post",
      data.postId,
      "Admin replied to a post",
    );
  }

  return reply;
}

export async function editReplyService(
  replyId: string,
  content: string,
  userId: string,
) {
  const reply = await findReplyById(replyId);
  if (!reply) throw ApiError.notFound("Reply not found");
  if (String(reply.author) !== userId) {
    throw ApiError.forbidden("You can only edit your own replies");
  }
  return updateReplyContent(replyId, content);
}

export async function deleteReplyService(
  replyId: string,
  userId: string,
  userRole: string,
) {
  const reply = await findReplyById(replyId);
  if (!reply) throw ApiError.notFound("Reply not found");

  const isOwner = String(reply.author) === userId;
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden(
      "You do not have permission to delete this reply",
    );
  }

  await softDeleteReply(replyId);
  await incrementPostReplyCount(String(reply.post), -1);

  if (isAdmin) {
    await logModeration(
      userId,
      "reply_deleted",
      "reply",
      replyId,
      "Deleted a reply",
    );
  }
}

export async function getNotesService(
  targetType: ForumNoteTargetType,
  targetId: string,
) {
  return findNotes(targetType, targetId);
}

export async function addNoteService(data: {
  targetType: ForumNoteTargetType;
  targetId: string;
  content: string;
  adminId: string;
}) {
  const note = await createNote({
    targetType: data.targetType,
    targetId: data.targetId,
    content: data.content,
    addedBy: data.adminId,
  });
  await logModeration(
    data.adminId,
    "note_added",
    data.targetType,
    data.targetId,
    "Added a note",
  );
  return note;
}

export async function deleteNoteService(noteId: string, adminId: string) {
  const note = await findNoteById(noteId);
  if (!note) throw ApiError.notFound("Note not found");
  await deleteNote(noteId);
  await logModeration(
    adminId,
    "note_deleted",
    note.targetType,
    String(note.targetId),
    "Deleted a note",
  );
}

export async function flagTargetService(data: {
  targetType: ForumNoteTargetType;
  targetId: string;
  reporterId: string;
  reason: string;
  explanation: string;
}) {
  const existing = await findFlagByReporterAndTarget(
    data.reporterId,
    data.targetType,
    data.targetId,
  );
  if (existing) {
    throw ApiError.conflict(
      `You have already flagged this ${data.targetType}`,
    );
  }

  const flag = await createFlag({
    targetType: data.targetType,
    targetId: data.targetId,
    reporter: data.reporterId,
    reason: data.reason,
    explanation: data.explanation,
  });

  if (data.targetType === "post") {
    await markPostFlagged(data.targetId, true);
  } else {
    await markReplyFlagged(data.targetId, true);
  }

  return flag;
}

export async function getFlagReportsService(
  targetType: ForumNoteTargetType,
  targetId: string,
) {
  return findFlagsByTarget(targetType, targetId);
}

export async function resolveFlagService(
  flagId: string,
  data: { status: "resolved" | "dismissed"; actionTaken?: string },
  adminId: string,
) {
  const flag = await findFlagById(flagId);
  if (!flag) throw ApiError.notFound("Flag not found");
  if (flag.status !== "pending") {
    throw ApiError.badRequest("This flag has already been processed");
  }

  const updated = await resolveFlagRepo(flagId, {
    status: data.status,
    actionTaken: data.actionTaken,
    resolvedBy: adminId,
  });

  // If no more pending flags on the target, un-flag it
  const remaining = await countPendingFlagsByTarget(
    flag.targetType,
    String(flag.targetId),
  );
  if (remaining === 0) {
    if (flag.targetType === "post") {
      await markPostFlagged(String(flag.targetId), false);
    } else {
      await markReplyFlagged(String(flag.targetId), false);
    }
  }

  const actionType: ModerationActionType =
    data.status === "resolved" ? "flag_resolved" : "flag_dismissed";
  await logModeration(
    adminId,
    actionType,
    flag.targetType,
    String(flag.targetId),
    data.actionTaken,
  );

  return updated;
}

export async function listGuidelines() {
  return findAllGuidelines();
}

export async function createGuidelineService(
  data: { icon: string; title: string; description: string },
  adminId: string,
) {
  const guideline = await createGuideline(data);
  await logModeration(
    adminId,
    "guideline_created",
    "guideline",
    guideline._id.toString(),
    `Created "${data.title}"`,
  );
  return guideline;
}

export async function updateGuidelineService(
  guidelineId: string,
  data: Partial<{ icon: string; title: string; description: string }>,
  adminId: string,
) {
  const existing = await findGuidelineById(guidelineId);
  if (!existing) throw ApiError.notFound("Guideline not found");
  const updated = await updateGuideline(guidelineId, data);
  await logModeration(
    adminId,
    "guideline_edited",
    "guideline",
    guidelineId,
    `Updated guideline "${updated?.title}"`,
  );
  return updated;
}

export async function deleteGuidelineService(
  guidelineId: string,
  adminId: string,
) {
  const guideline = await findGuidelineById(guidelineId);
  if (!guideline) throw ApiError.notFound("Guideline not found");
  await deleteGuidelineRepo(guidelineId);
  await logModeration(
    adminId,
    "guideline_deleted",
    "guideline",
    guidelineId,
    `Deleted guideline "${guideline.title}"`,
  );
}

export async function getTopContributors(limit = 10) {
  const raw = await findTopContributors(limit);
  return raw.map((entry, index) => ({
    id: String(entry._id),
    rank: index + 1,
    name: `${entry.user.firstName} ${entry.user.lastName}`,
    avatar: entry.user.avatar,
    commentCount: entry.commentCount,
    isVerified:
      entry.user.role === "instructor" || entry.user.role === "admin",
    badgeColor:
      entry.user.role === "admin"
        ? "gold"
        : entry.user.role === "instructor"
          ? "blue"
          : "gray",
  }));
}

export async function listModerationLogs(opts: ModerationLogOptions) {
  return findModerationLogsPaginated(opts);
}

export async function listForumUserAccess(page: number, limit: number) {
  return findForumUserAccessPaginated(page, limit);
}

export async function updateForumUserAccessService(
  userId: string,
  data: { status: string; reason?: string; duration?: string },
  adminId: string,
) {
  const result = await upsertForumUserAccess(userId, {
    ...data,
    updatedBy: adminId,
  });
  await logModeration(
    adminId,
    "user_access_updated",
    "user",
    userId,
    `Set forum access to "${data.status}"${data.reason ? ` — ${data.reason}` : ""}`,
  );
  return result;
}
