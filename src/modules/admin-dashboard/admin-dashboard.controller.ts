import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import {
  getAdminDashboardSummaryService,
  getAdminDashboardChartService,
} from "./admin-dashboard.service";
import { dashboardChartQuerySchema } from "@/modules/admin-dashboard/admin-dashboard.validation";

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
