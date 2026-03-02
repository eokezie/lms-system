import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import { createCourseService } from "./course.service";

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
