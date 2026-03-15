import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
	createCourseService,
	getExploreCoursesService,
	getRelatedCoursesService,
	getSingleCourseWithModulesAndLessons,
	updateCoursePriceService,
} from "./course.service";
import { z } from "zod";
import { getExploreCoursesQuerySchema } from "./course.validation";
import { getUploadedFiles } from "@/helpers/multerHelper";

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

export const getSingleCourseHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params as { id: string };
		const course = await getSingleCourseWithModulesAndLessons(id);
		sendSuccess({
			res,
			message: "Course fetched successfully",
			data: course,
		});
	},
);

export const getRelatedCoursesHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params as { id: string };
		const limit = (req.query as { limit?: number }).limit ?? 3;
		const courses = await getRelatedCoursesService(id, limit);
		sendSuccess({
			res,
			message: "Related courses fetched successfully",
			data: courses,
		});
	},
);

export const createCourseHandler = catchAsync(
	async (req: Request, res: Response) => {
		const uploadedFiles = getUploadedFiles(req);
		const course = await createCourseService(req.body, uploadedFiles);
		sendCreated({
			res,
			message: "Course created successfully",
			data: course,
		});
	},
);

export const updateCoursePriceHandler = catchAsync(
	async (req: Request, res: Response) => {
		const { id } = req.params as { id: string };
		const course = await updateCoursePriceService(id, req.body);
		sendSuccess({
			res,
			message: "Course price updated successfully",
			data: course,
		});
	},
);
