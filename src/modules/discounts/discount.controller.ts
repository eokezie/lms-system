import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  createDiscountService,
  listDiscountsService,
  listActiveDiscountsService,
  listInactiveDiscountsService,
  updateDiscountService,
  deleteDiscountService,
  getDiscountByIdService,
  getActiveDiscountForCourseService,
} from "./discount.service";

export const createDiscountHandler = catchAsync(
  async (req: Request, res: Response) => {
    const discount = await createDiscountService(req.body);
    sendCreated({
      res,
      message: "Discount created successfully",
      data: discount,
    });
  },
);

export const listDiscountsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit, courseId } = req.query as {
      page?: number;
      limit?: number;
      courseId?: string;
    };
    const result = await listDiscountsService(page ?? 1, limit ?? 20, courseId);
    sendSuccess({
      res,
      message: "Discounts fetched successfully",
      data: result.discounts,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const listActiveDiscountsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit, courseId } = req.query as {
      page?: number;
      limit?: number;
      courseId?: string;
    };
    const result = await listActiveDiscountsService(
      page ?? 1,
      limit ?? 20,
      courseId,
    );
    sendSuccess({
      res,
      message: "Active discounts fetched successfully",
      data: result.discounts,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const listInactiveDiscountsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit, courseId } = req.query as {
      page?: number;
      limit?: number;
      courseId?: string;
    };
    const result = await listInactiveDiscountsService(
      page ?? 1,
      limit ?? 20,
      courseId,
    );
    sendSuccess({
      res,
      message: "Inactive discounts fetched successfully",
      data: result.discounts,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const getDiscountByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const discount = await getDiscountByIdService(id);
    sendSuccess({
      res,
      message: "Discount fetched successfully",
      data: discount,
    });
  },
);

export const updateDiscountHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const discount = await updateDiscountService(id, req.body);
    sendSuccess({
      res,
      message: "Discount updated successfully",
      data: discount,
    });
  },
);

export const deleteDiscountHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await deleteDiscountService(id);
    sendSuccess({
      res,
      message: "Discount deleted successfully",
    });
  },
);

export const getActiveDiscountForCourseHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { courseId } = req.params as { courseId: string };
    const discount = await getActiveDiscountForCourseService(courseId);
    sendSuccess({
      res,
      message: discount ? "Active discount found" : "No active discount",
      data: discount,
    });
  },
);
