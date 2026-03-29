import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { z } from "zod";
import {
  getStudentEnrollmentsQuerySchema,
  getCourseEnrollmentsQuerySchema,
} from "./enrollment.validation";
import {
  getStudentEnrollmentsPaginated,
  getCourseEnrollmentsListService,
} from "./enrollment.service";

type GetStudentEnrollmentsQuery = z.infer<
  typeof getStudentEnrollmentsQuerySchema
>;

type GetCourseEnrollmentsQuery = z.infer<typeof getCourseEnrollmentsQuerySchema>;

export const getCourseEnrollmentsForCourseHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id: courseId } = req.params as { id: string };
    const query = req.query as unknown as GetCourseEnrollmentsQuery;
    const result = await getCourseEnrollmentsListService(
      courseId,
      {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        search: query.search,
        sort: query.sort ?? "most_recent",
        status: query.status ?? "all",
      },
      req.user!.userId,
      req.user!.role,
    );
    sendSuccess({
      res,
      message: "Course enrollments fetched successfully",
      data: result.enrollments,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const getMyEnrollmentsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.userId;
    const query = (await getStudentEnrollmentsQuerySchema.parseAsync(
      req.query,
    )) as GetStudentEnrollmentsQuery;

    const result = await getStudentEnrollmentsPaginated(studentId, query);

    sendSuccess({
      res,
      message: "Enrollments fetched successfully",
      data: result.enrollments,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);
