import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import type { UserRole } from "@/modules/users/user.model";
import {
  listDiscussionThreadsService,
  createDiscussionThreadService,
  getDiscussionThreadDetailService,
  createDiscussionReplyService,
} from "./discussion.service";
import { z } from "zod";
import { listDiscussionsQuerySchema, threadRepliesQuerySchema } from "./discussion.validation";

type ListQuery = z.infer<typeof listDiscussionsQuerySchema>;
type ThreadRepliesQuery = z.infer<typeof threadRepliesQuerySchema>;

export const listDiscussionsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: courseId } = req.params as { id: string };
    const query = req.query as unknown as ListQuery;
    const result = await listDiscussionThreadsService(
      courseId,
      req.user!.userId,
      req.user!.role as UserRole,
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        lessonId: query.lessonId,
        sort: query.sort ?? "most_recent",
      },
    );
    sendSuccess({
      res,
      message: "Discussions fetched successfully",
      data: result.threads,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const createDiscussionHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: courseId } = req.params as { id: string };
    const body = req.body as {
      title: string;
      body: string;
      lessonId?: string | null;
    };
    const thread = await createDiscussionThreadService(
      courseId,
      req.user!.userId,
      req.user!.role as UserRole,
      body,
    );
    sendCreated({
      res,
      message: "Discussion created successfully",
      data: thread,
    });
  },
);

export const getDiscussionThreadHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: courseId, threadId } = req.params as {
      id: string;
      threadId: string;
    };
    const q = req.query as unknown as ThreadRepliesQuery;
    const result = await getDiscussionThreadDetailService(
      courseId,
      threadId,
      req.user!.userId,
      req.user!.role as UserRole,
      {
        page: q.page ?? 1,
        limit: q.limit ?? 50,
      },
    );
    sendSuccess({
      res,
      message: "Discussion fetched successfully",
      data: {
        thread: result.thread,
        replies: result.replies,
      },
      meta: { replies: result.repliesMeta },
    });
  },
);

export const createDiscussionReplyHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: courseId, threadId } = req.params as {
      id: string;
      threadId: string;
    };
    const body = req.body as { body: string };
    const reply = await createDiscussionReplyService(
      courseId,
      threadId,
      req.user!.userId,
      req.user!.role as UserRole,
      body,
    );
    sendCreated({
      res,
      message: "Reply posted successfully",
      data: reply,
    });
  },
);
