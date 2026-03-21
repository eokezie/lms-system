import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  createCourseService,
  getExploreCoursesService,
  getRelatedCoursesService,
  getSingleCourseWithModulesAndLessons,
  updateCoursePriceService,
  getManageCoursesService,
  getCourseStatsService,
  updateCourseService,
  deleteCourseService,
} from "./course.service";
import { z } from "zod";
import {
  getExploreCoursesQuerySchema,
  getManageCoursesQuerySchema,
} from "./course.validation";
import { getUploadedFiles } from "@/helpers/multerHelper";
import { getCoursePlayerData } from "./course.player.service";

type ExploreCoursesQuery = z.infer<typeof getExploreCoursesQuerySchema>;
type ManageCoursesQuery = z.infer<typeof getManageCoursesQuerySchema>;

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

export const getManageCoursesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query as unknown as ManageCoursesQuery;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const result = await getManageCoursesService(query, userId, userRole);
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

export const getCourseStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await getCourseStatsService();
    sendSuccess({
      res,
      message: "Course stats fetched successfully",
      data: stats,
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

export const getCoursePlayerHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const studentId = req.user!.userId;
    const data = await getCoursePlayerData(id, studentId);
    sendSuccess({
      res,
      message: "Course player data fetched successfully",
      data,
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
    const course = await createCourseService(
      req.body,
      uploadedFiles,
      req.user!.role,
    );
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

export const updateCourseHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const course = await updateCourseService(id, userId, userRole, req.body);
    sendSuccess({
      res,
      message: "Course updated successfully",
      data: course,
    });
  },
);

export const deleteCourseHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    await deleteCourseService(id, userId, userRole);
    sendSuccess({
      res,
      message: "Course deleted successfully",
    });
  },
);
