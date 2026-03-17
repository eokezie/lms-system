import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { updateLessonProgressSchema } from "./progress.validation";
import { updateLessonProgressService } from "./progress.service";

export const updateLessonProgressHandler = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.userId;
    const { courseId, lessonId } = req.params as {
      courseId: string;
      lessonId: string;
    };
    const body = await updateLessonProgressSchema.parseAsync(req.body);

    const result = await updateLessonProgressService(
      studentId,
      courseId,
      lessonId,
      body.status,
      body.percent,
    );

    sendSuccess({
      res,
      message: "Lesson progress updated",
      data: result,
    });
  },
);
