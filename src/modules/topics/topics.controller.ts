import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  createTopicsService,
  deleteTopicsService,
  getAllTopics,
  updateTopicsService,
} from "./topics.service";

export const createTopicHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { label } = req.body;
    const userId = req.user!.userId;
    const topic = await createTopicsService({ label, createdBy: userId });
    sendCreated({
      res,
      message: "Topic was created successfully",
      data: topic,
    });
  },
);

export const getAllTopicsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { limit, page, search } = req.query;
    const documentLimit = Number(limit) || 10;
    const pageNumber = Number(page) || 1;
    const response = await getAllTopics(
      documentLimit,
      pageNumber,
      search as any,
    );
    sendSuccess({
      res,
      message: "Topics were fetched successfully",
      data: response.topics,
      meta: {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      },
    });
  },
);

export const updateTopicHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { topicId } = req.params;
    const topic = await updateTopicsService(topicId, req.body);
    sendSuccess({
      res,
      message: "Topic updated successfully",
      data: topic,
    });
  },
);

export const deleteTopicHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { topicId } = req.params;
    await deleteTopicsService(topicId);
    sendSuccess({
      res,
      message: "Topic was deleted successfully",
      data: null,
    });
  },
);
