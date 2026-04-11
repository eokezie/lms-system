import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import { getUploadedFiles } from "@/helpers/multerHelper";
import {
  createCareerPathService,
  updateCareerPathService,
  listCareerPathsAdminService,
  exploreCareerPathsService,
  getCareerPathByIdForViewer,
  deleteCareerPathService,
  getCareerPathStatsService,
  enrollInCareerPathService,
  dropCareerPathEnrollmentService,
  completeCareerPathEnrollmentService,
  listMyCareerPathsService,
} from "./career-path.service";
import {
  listCareerPathsQuerySchema,
  exploreCareerPathsQuerySchema,
  careerPathIdParamSchema,
} from "./career-path.validation";
import { z } from "zod";

type ListQuery = z.infer<typeof listCareerPathsQuerySchema>;
type ExploreQuery = z.infer<typeof exploreCareerPathsQuerySchema>;

export const getCareerPathStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await getCareerPathStatsService();
    sendSuccess({
      res,
      message: "Career path statistics fetched successfully",
      data,
    });
  },
);

export const exploreCareerPathsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as ExploreQuery;
    const data = await exploreCareerPathsService(query);
    sendSuccess({
      res,
      message: "Career paths fetched successfully",
      data: data.items,
      meta: {
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      },
    });
  },
);

export const listCareerPathsAdminHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as ListQuery;
    const result = await listCareerPathsAdminService(query);
    sendSuccess({
      res,
      message: "Career paths fetched successfully",
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const enrollCareerPathHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = careerPathIdParamSchema.parse(req.params);
    const studentId = req.user!.userId;
    await enrollInCareerPathService(id, studentId);
    sendSuccess({
      res,
      message: "Enrolled in career path successfully",
      data: null,
    });
  },
);

export const dropCareerPathEnrollmentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = careerPathIdParamSchema.parse(req.params);
    const studentId = req.user!.userId;
    await dropCareerPathEnrollmentService(id, studentId);
    sendSuccess({
      res,
      message: "Left career path successfully",
      data: null,
    });
  },
);

export const listMyCareerPathsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const studentId = req.user!.userId;
    const data = await listMyCareerPathsService(studentId);
    sendSuccess({
      res,
      message: "Career path enrollments fetched successfully",
      data,
    });
  },
);

export const completeCareerPathEnrollmentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = careerPathIdParamSchema.parse(req.params);
    const studentId = req.user!.userId;
    await completeCareerPathEnrollmentService(id, studentId);
    sendSuccess({
      res,
      message: "Career path marked as completed",
      data: null,
    });
  },
);

export const getCareerPathByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = careerPathIdParamSchema.parse(req.params);
    const role = req.user!.role;
    const doc = await getCareerPathByIdForViewer(id, role);
    sendSuccess({
      res,
      message: "Career path fetched successfully",
      data: doc,
    });
  },
);

export const createCareerPathHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const files = getUploadedFiles(req);
    const doc = await createCareerPathService(
      req.body,
      files.thumbnail,
      userId,
    );
    sendCreated({
      res,
      message: "Career path created successfully",
      data: doc,
    });
  },
);

export const updateCareerPathHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = careerPathIdParamSchema.parse(req.params);
    const files = getUploadedFiles(req);
    const doc = await updateCareerPathService(id, req.body, files.thumbnail);
    sendSuccess({
      res,
      message: "Career path updated successfully",
      data: doc,
    });
  },
);

export const deleteCareerPathHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = careerPathIdParamSchema.parse(req.params);
    await deleteCareerPathService(id);
    sendSuccess({
      res,
      message: "Career path deleted successfully",
    });
  },
);
