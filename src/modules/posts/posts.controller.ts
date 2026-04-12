import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import { createPostService, getPaginatedPosts } from "./posts.service";
import { PostPaginationOptions } from "./posts.types";

export const createPostHandler = catchAsync(
  async (req: Request, res: Response) => {
    const body = req.body;
    body.authorRole = req.user!.role;
    const post = await createPostService(body);
    sendCreated({
      res,
      message: "Post was created successfully",
      data: post,
    });
  },
);

export const getPaginatedPostsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getPaginatedPosts(
      req.query as unknown as PostPaginationOptions,
    );
    sendSuccess({
      res,
      message: "Posts were fetched successfully",
      data: result.posts,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);
