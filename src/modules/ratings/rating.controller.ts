import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  createRatingService,
  getRatingsForCourseService,
  updateRatingService,
  deleteRatingService,
} from "./rating.service";
import { z } from "zod";
import { getRatingsQuerySchema } from "./rating.validation";

type GetRatingsQuery = z.infer<typeof getRatingsQuerySchema>;

export const createRatingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const courseId = (req.params as { id: string }).id;
    const userId = req.user!.userId;
    const rating = await createRatingService(courseId, userId, req.body);
    sendCreated({
      res,
      message: "Rating submitted successfully",
      data: rating,
    });
  },
);

export const getRatingsForCourseHandler = catchAsync(
  async (req: Request, res: Response) => {
    const courseId = (req.params as { id: string }).id;
    const query = req.query as unknown as GetRatingsQuery;
    const result = await getRatingsForCourseService(courseId, query);
    sendSuccess({
      res,
      message: "Ratings fetched successfully",
      data: {
        averageRating: result.averageRating,
        totalRatings: result.totalRatings,
        ratings: result.ratings,
      },
      meta: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  },
);

export const updateRatingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { ratingId } = req.params as { ratingId: string };
    const userId = req.user!.userId;
    const rating = await updateRatingService(ratingId, userId, req.body);
    sendSuccess({
      res,
      message: "Rating updated successfully",
      data: rating,
    });
  },
);

export const deleteRatingHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { ratingId } = req.params as { ratingId: string };
    const userId = req.user!.userId;
    await deleteRatingService(ratingId, userId);
    sendSuccess({
      res,
      message: "Rating deleted successfully",
    });
  },
);
