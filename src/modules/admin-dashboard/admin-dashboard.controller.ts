import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import {
  getAdminDashboardSummaryService,
  getAdminDashboardChartService,
  getAdminDashboardTopCoursesService,
} from "./admin-dashboard.service";
import {
  dashboardChartQuerySchema,
  topCoursesQuerySchema,
} from "@/modules/admin-dashboard/admin-dashboard.validation";

export const getAdminDashboardSummaryHandler = catchAsync(
  async (req: Request, res: Response) => {
    const data = await getAdminDashboardSummaryService(
      req.user!.role,
      req.user!.userId,
    );
    sendSuccess({
      res,
      message: "Dashboard summary fetched successfully",
      data,
    });
  },
);

export const getAdminDashboardChartHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = dashboardChartQuerySchema.parse(req.query);
    const data = await getAdminDashboardChartService(
      query,
      req.user!.role,
      req.user!.userId,
    );
    sendSuccess({
      res,
      message: "Dashboard chart data fetched successfully",
      data,
    });
  },
);

export const getAdminDashboardTopCoursesHandler = catchAsync(
  async (req: Request, res: Response) => {
    const query = topCoursesQuerySchema.parse(req.query);
    const data = await getAdminDashboardTopCoursesService(
      req.user!.role,
      req.user!.userId,
      query,
    );
    sendSuccess({
      res,
      message: "Top courses fetched successfully",
      data,
    });
  },
);
