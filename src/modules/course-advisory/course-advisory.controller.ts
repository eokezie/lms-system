import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { getAdvisoryRecommendations } from "./course-advisory.service";

export const submitCourseAdvisory = catchAsync(
  async (req: Request, res: Response) => {
    const { answers } = req.body;

    const recommendations = await getAdvisoryRecommendations(answers);

    res.status(200).json({
      success: true,
      message: "Course recommendations generated successfully",
      data: recommendations,
    });
  },
);
