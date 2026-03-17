import { Router } from "express";
import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { z } from "zod";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import { LessonNote } from "./note.model";
import { isStudentEnrolled } from "@/modules/enrollments/enrollment.repository";

const router = Router({ mergeParams: true });

const noteBodySchema = z.object({
  content: z.string().trim().min(1),
});

router.use(authenticate);

router.get(
  "/my",
  catchAsync(async (req, res) => {
    const studentId = req.user!.userId;
    const { courseId, lessonId } = req.params as {
      courseId: string;
      lessonId: string;
    };

    const notes = await LessonNote.find({
      student: studentId,
      course: courseId,
      lesson: lessonId,
    })
      .sort({ createdAt: -1 })
      .exec();

    sendSuccess({
      res,
      message: "Notes fetched successfully",
      data: notes,
    });
  }),
);

router.post(
  "/",
  validate(noteBodySchema),
  catchAsync(async (req, res) => {
    const studentId = req.user!.userId;
    const { courseId, lessonId } = req.params as {
      courseId: string;
      lessonId: string;
    };

    const enrolled = await isStudentEnrolled(studentId, courseId);
    if (!enrolled) {
      res
        .status(403)
        .json({ success: false, message: "Not enrolled in this course" });
      return;
    }

    const body = await noteBodySchema.parseAsync(req.body);
    const note = await LessonNote.create({
      student: studentId,
      course: courseId,
      lesson: lessonId,
      content: body.content,
    });

    sendSuccess({
      res,
      message: "Note created successfully",
      data: note,
    });
  }),
);

export default router;
