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
  async (req: Request, res: Response) => {
    const publishedOnly = (req.query as { publishedOnly?: boolean })
      ?.publishedOnly;
    const categories = await getCategoriesAndCountPerCourse({
      publishedOnly,
    });
    sendSuccess({
      res,
      message: "Categories were fetched successfully",
      data: categories,
    });
  },
);
