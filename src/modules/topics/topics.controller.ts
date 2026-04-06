import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  createTopicsService,
  deleteTopicsService,
  getTopicsAndCountPerPost,
  updateTopicsService,
} from "./topics.service";

export const createTopicHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { label } = req.body;
    const userId = req.user!.userId;
    const topic = await createTopicsService({ label, createdBy: userId });
    sendCreated({
      res,
      message: "Topic created successfully",
      data: topic,
    });
  },
);

export const getTopicsAndPostCountHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const topics = await getTopicsAndCountPerPost();
    sendSuccess({
      res,
      message: "Topics were fetched successfully",
      data: topics,
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
