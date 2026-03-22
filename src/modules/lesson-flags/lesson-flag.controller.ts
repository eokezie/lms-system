import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  LESSON_FLAG_REASONS,
  LESSON_FLAG_REASON_LABELS,
} from "./lesson-flag.model";
import {
  createLessonFlagService,
  listLessonFlagsService,
  getLessonFlagByIdService,
  patchLessonFlagService,
} from "./lesson-flag.service";
import {
  createLessonFlagSchema,
  listLessonFlagsQuerySchema,
  lessonFlagIdParamSchema,
  patchLessonFlagSchema,
} from "./lesson-flag.validation";

export const createLessonFlagHandler = catchAsync(
  async (req: Request, res: Response) => {
    const body = createLessonFlagSchema.parse(req.body);
    const data = await createLessonFlagService(
      body,
      req.user!.userId,
      req.user!.role,
    );
    sendCreated({
      res,
      message: "Lesson flagged successfully",
      data,
    });
  },
);

export const listLessonFlagsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = listLessonFlagsQuerySchema.parse(req.query);
    const result = await listLessonFlagsService(
      query,
      req.user!.role,
      req.user!.userId,
    );
    sendSuccess({
      res,
      message: "Lesson flags fetched successfully",
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        reasons: [...LESSON_FLAG_REASONS],
        reasonLabels: LESSON_FLAG_REASON_LABELS,
      },
    });
  },
);

export const getLessonFlagByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = lessonFlagIdParamSchema.parse(req.params);
    const data = await getLessonFlagByIdService(
      id,
      req.user!.role,
      req.user!.userId,
    );
    sendSuccess({
      res,
      message: "Lesson flag fetched successfully",
      data,
    });
  },
);

export const patchLessonFlagHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = lessonFlagIdParamSchema.parse(req.params);
    const body = patchLessonFlagSchema.parse(req.body);
    const data = await patchLessonFlagService(
      id,
      body,
      req.user!.role,
      req.user!.userId,
    );
    sendSuccess({
      res,
      message: "Lesson flag updated successfully",
      data,
    });
  },
);
