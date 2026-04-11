import { Request, Response } from "express";

import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  addCourseBookmarkService,
  removeCourseBookmarkService,
  listMyCourseBookmarksService,
  listMyBookmarkedCourseIdsService,
} from "./bookmark.service";
import {
  courseBookmarkParamSchema,
  listBookmarksQuerySchema,
  type ListBookmarksQuery,
} from "./bookmark.validation";

export const addCourseBookmarkHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { courseId } = courseBookmarkParamSchema.parse(req.params);
    const studentId = req.user!.userId;
    await addCourseBookmarkService(studentId, courseId);
    sendCreated({
      res,
      message: "Course bookmarked successfully",
      data: null,
    });
  },
);

export const removeCourseBookmarkHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { courseId } = courseBookmarkParamSchema.parse(req.params);
    const studentId = req.user!.userId;
    await removeCourseBookmarkService(studentId, courseId);
    sendSuccess({
      res,
      message: "Bookmark removed successfully",
      data: null,
    });
  },
);

export const listMyCourseBookmarksHandler = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.userId;
    const query = listBookmarksQuerySchema.parse(
      req.query,
    ) as ListBookmarksQuery;
    const result = await listMyCourseBookmarksService(studentId, query);
    sendSuccess({
      res,
      message: "Bookmarks fetched successfully",
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

export const listMyBookmarkedCourseIdsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.userId;
    const data = await listMyBookmarkedCourseIdsService(studentId);
    sendSuccess({
      res,
      message: "Bookmarked course ids fetched successfully",
      data,
    });
  },
);
