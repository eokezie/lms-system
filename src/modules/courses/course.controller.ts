import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  createCourseService,
  getExploreCoursesService,
} from "./course.service";
import { z } from "zod";
import { getExploreCoursesQuerySchema } from "./course.validation";

type ExploreCoursesQuery = z.infer<typeof getExploreCoursesQuerySchema>;

export const getExploreCoursesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getExploreCoursesService(
      req.query as unknown as ExploreCoursesQuery,
    );
    sendSuccess({
      res,
      message: "Courses fetched successfully",
      data: result.courses,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const createCourseHandler = catchAsync(
  async (req: Request, res: Response) => {
    const course = await createCourseService(req.body);
    sendCreated({
      res,
      message: "Course created successfully",
      data: course,
    });
  },
);
