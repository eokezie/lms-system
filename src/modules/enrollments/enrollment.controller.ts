import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { z } from "zod";
import { getStudentEnrollmentsQuerySchema } from "./enrollment.validation";
import { getStudentEnrollmentsPaginated } from "./enrollment.service";

type GetStudentEnrollmentsQuery = z.infer<
  typeof getStudentEnrollmentsQuerySchema
>;

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
