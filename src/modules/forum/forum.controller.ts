import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess, sendCreated } from "@/utils/apiResponse";
import * as svc from "./forum.service";

export const listTopics = catchAsync(async (_req: Request, res: Response) => {
  const topics = await svc.listTopics();
  sendSuccess({ res, message: "Topics fetched successfully", data: topics });
});

export const createTopic = catchAsync(async (req: Request, res: Response) => {
  const topic = await svc.createTopicService(req.body.name, req.user!.userId);
  sendCreated({ res, message: "Topic created successfully", data: topic });
});

export const editTopic = catchAsync(async (req: Request, res: Response) => {
  const topic = await svc.updateTopicService(
    req.params.topicId,
    req.body.name,
    req.user!.userId,
  );
  sendSuccess({ res, message: "Topic updated successfully", data: topic });
});

export const deleteTopic = catchAsync(async (req: Request, res: Response) => {
  await svc.deleteTopicService(req.params.topicId, req.user!.userId);
  sendSuccess({ res, message: "Topic deleted successfully" });
});

export const listPosts = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as any;
  if (q.authorId === "me") q.authorId = req.user!.userId;
  const result = await svc.listPosts({
    page: q.page,
    limit: q.limit,
    sort: q.sort,
    topic: q.topic,
    search: q.search,
    authorId: q.authorId,
    status: q.status,
  });
  sendSuccess({
    res,
    message: "Posts fetched successfully",
    data: result.posts,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const getPost = catchAsync(async (req: Request, res: Response) => {
  const post = await svc.getPostDetail(req.params.postId);
  sendSuccess({ res, message: "Post fetched successfully", data: post });
});

export const createPost = catchAsync(async (req: Request, res: Response) => {
  const post = await svc.createPostService({
    topicId: req.body.topicId,
    title: req.body.title,
    content: req.body.content,
    authorId: req.user!.userId,
  });
  sendCreated({ res, message: "Post created successfully", data: post });
});

export const editPost = catchAsync(async (req: Request, res: Response) => {
  const post = await svc.editPostService(
    req.params.postId,
    req.body.content,
    req.user!.userId,
  );
  sendSuccess({ res, message: "Post updated successfully", data: post });
});

export const deletePost = catchAsync(async (req: Request, res: Response) => {
  await svc.deletePostService(
    req.params.postId,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess({ res, message: "Post deleted successfully" });
});

export const viewPost = catchAsync(async (req: Request, res: Response) => {
  await svc.incrementViewCount(req.params.postId);
  sendSuccess({ res, message: "View recorded" });
});

export const listReplies = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as any;
  const result = await svc.listReplies(req.params.postId, q.page, q.limit);
  sendSuccess({
    res,
    message: "Replies fetched successfully",
    data: result.replies,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

export const createReply = catchAsync(async (req: Request, res: Response) => {
  const reply = await svc.createReplyService({
    postId: req.params.postId,
    authorId: req.user!.userId,
    content: req.body.content,
    attachments: req.body.attachments,
    authorRole: req.user!.role,
  });
  sendCreated({ res, message: "Reply created successfully", data: reply });
});

export const editReply = catchAsync(async (req: Request, res: Response) => {
  const reply = await svc.editReplyService(
    req.params.replyId,
    req.body.content,
    req.user!.userId,
  );
  sendSuccess({ res, message: "Reply updated successfully", data: reply });
});

export const deleteReply = catchAsync(async (req: Request, res: Response) => {
  await svc.deleteReplyService(
    req.params.replyId,
    req.user!.userId,
    req.user!.role,
  );
  sendSuccess({ res, message: "Reply deleted successfully" });
});

export const getPostNotes = catchAsync(async (req: Request, res: Response) => {
  const notes = await svc.getNotesService("post", req.params.postId);
  sendSuccess({ res, message: "Post notes fetched successfully", data: notes });
});

export const addPostNote = catchAsync(async (req: Request, res: Response) => {
  const note = await svc.addNoteService({
    targetType: "post",
    targetId: req.params.postId,
    content: req.body.content,
    adminId: req.user!.userId,
  });
  sendCreated({ res, message: "Note added successfully", data: note });
});

export const deletePostNote = catchAsync(
  async (req: Request, res: Response) => {
    await svc.deleteNoteService(req.params.noteId, req.user!.userId);
    sendSuccess({ res, message: "Note deleted successfully" });
  },
);

export const getReplyNotes = catchAsync(async (req: Request, res: Response) => {
  const notes = await svc.getNotesService("reply", req.params.replyId);
  sendSuccess({
    res,
    message: "Reply notes fetched successfully",
    data: notes,
  });
});

export const addReplyNote = catchAsync(async (req: Request, res: Response) => {
  const note = await svc.addNoteService({
    targetType: "reply",
    targetId: req.params.replyId,
    content: req.body.content,
    adminId: req.user!.userId,
  });
  sendCreated({ res, message: "Note added successfully", data: note });
});

export const deleteReplyNote = catchAsync(
  async (req: Request, res: Response) => {
    await svc.deleteNoteService(req.params.noteId, req.user!.userId);
    sendSuccess({ res, message: "Note deleted successfully" });
  },
);

export const flagPost = catchAsync(async (req: Request, res: Response) => {
  const flag = await svc.flagTargetService({
    targetType: "post",
    targetId: req.params.postId,
    reporterId: req.user!.userId,
    reason: req.body.reason,
    explanation: req.body.explanation,
  });
  sendCreated({ res, message: "Post flagged successfully", data: flag });
});

export const flagReply = catchAsync(async (req: Request, res: Response) => {
  const flag = await svc.flagTargetService({
    targetType: "reply",
    targetId: req.params.replyId,
    reporterId: req.user!.userId,
    reason: req.body.reason,
    explanation: req.body.explanation,
  });
  sendCreated({ res, message: "Reply flagged successfully", data: flag });
});

export const getPostFlags = catchAsync(async (req: Request, res: Response) => {
  const flags = await svc.getFlagReportsService("post", req.params.postId);
  sendSuccess({
    res,
    message: "Post flag reports fetched successfully",
    data: flags,
  });
});

export const getReplyFlags = catchAsync(async (req: Request, res: Response) => {
  const flags = await svc.getFlagReportsService("reply", req.params.replyId);
  sendSuccess({
    res,
    message: "Reply flag reports fetched successfully",
    data: flags,
  });
});

export const resolveFlag = catchAsync(async (req: Request, res: Response) => {
  const flag = await svc.resolveFlagService(
    req.params.flagId,
    { status: req.body.status, actionTaken: req.body.actionTaken },
    req.user!.userId,
  );
  sendSuccess({ res, message: "Flag resolved successfully", data: flag });
});

export const listGuidelines = catchAsync(
  async (_req: Request, res: Response) => {
    const guidelines = await svc.listGuidelines();
    sendSuccess({
      res,
      message: "Guidelines fetched successfully",
      data: guidelines,
    });
  },
);

export const createGuideline = catchAsync(
  async (req: Request, res: Response) => {
    const guideline = await svc.createGuidelineService(
      req.body,
      req.user!.userId,
    );
    sendCreated({
      res,
      message: "Guideline created successfully",
      data: guideline,
    });
  },
);

export const editGuideline = catchAsync(
  async (req: Request, res: Response) => {
    const guideline = await svc.updateGuidelineService(
      req.params.guidelineId,
      req.body,
      req.user!.userId,
    );
    sendSuccess({
      res,
      message: "Guideline updated successfully",
      data: guideline,
    });
  },
);

export const deleteGuideline = catchAsync(
  async (req: Request, res: Response) => {
    await svc.deleteGuidelineService(req.params.guidelineId, req.user!.userId);
    sendSuccess({ res, message: "Guideline deleted successfully" });
  },
);

export const getTopContributors = catchAsync(
  async (req: Request, res: Response) => {
    const q = req.query as any;
    const contributors = await svc.getTopContributors(q.limit);
    sendSuccess({
      res,
      message: "Top contributors fetched successfully",
      data: contributors,
    });
  },
);

export const getModerationLogs = catchAsync(
  async (req: Request, res: Response) => {
    const q = req.query as any;
    const result = await svc.listModerationLogs({
      page: q.page,
      limit: q.limit,
      actorId: q.actorId,
      actionType: q.actionType,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
    });
    sendSuccess({
      res,
      message: "Moderation activities fetched successfully",
      data: result.logs,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const listUserAccess = catchAsync(
  async (req: Request, res: Response) => {
    const q = req.query as any;
    const result = await svc.listForumUserAccess(q.page ?? 1, q.limit ?? 20);
    sendSuccess({
      res,
      message: "Forum user access fetched successfully",
      data: result.users,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const updateUserAccess = catchAsync(
  async (req: Request, res: Response) => {
    const result = await svc.updateForumUserAccessService(
      req.params.userId,
      req.body,
      req.user!.userId,
    );
    sendSuccess({
      res,
      message: "User access updated successfully",
      data: result,
    });
  },
);
