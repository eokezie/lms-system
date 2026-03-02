import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
	createCategoryService,
	getCategoriesAndCountPerCourse,
} from "./category.service";

export const createCategoryHandler = catchAsync(
	async (req: Request, res: Response) => {
		const category = await createCategoryService(req.body);
		sendCreated({
			res,
			message: "Category created successfully",
			data: category,
		});
	},
);

export const getCategoriesAndCourseCountHandler = catchAsync(
	async (_req: Request, res: Response) => {
		const categories = await getCategoriesAndCountPerCourse();
		sendSuccess({
			res,
			message: "Categories were fetched successfully",
			data: categories,
		});
	},
);
