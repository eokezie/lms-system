import { Request, Response } from "express";

import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  addNoteToFeedbackService,
  createFeedbackService,
  deleteFeedbackService,
  getFeedbackByIdService,
  listFeedbackService,
} from "./feedback.service";
import {
  addNoteSchema,
  createFeedbackSchema,
  feedbackIdParamSchema,
  listFeedbackQuerySchema,
  type ListFeedbackQuery,
} from "./feedback.validation";

export const createFeedbackHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { title, body } = createFeedbackSchema.parse(req.body);
    const feedback = await createFeedbackService(userId, title, body);
    sendCreated({
      res,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  },
);

export const listFeedbackHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = listFeedbackQuerySchema.parse(
      req.query,
    ) as ListFeedbackQuery;
    const result = await listFeedbackService(query);
    sendSuccess({
      res,
      message: "Feedback fetched successfully",
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

export const getFeedbackHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = feedbackIdParamSchema.parse(req.params);
    const feedback = await getFeedbackByIdService(id);
    sendSuccess({
      res,
      message: "Feedback fetched successfully",
      data: feedback,
    });
  },
);

export const addNoteHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = feedbackIdParamSchema.parse(req.params);
    const { note } = addNoteSchema.parse(req.body);
    const feedback = await addNoteToFeedbackService(id, note);
    sendSuccess({
      res,
      message: "Note added successfully",
      data: feedback,
    });
  },
);

export const deleteFeedbackHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = feedbackIdParamSchema.parse(req.params);
    await deleteFeedbackService(id);
    sendSuccess({
      res,
      message: "Feedback deleted successfully",
      data: null,
    });
  },
);
