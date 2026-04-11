import { Request, Response } from "express";

import { catchAsync } from "@/utils/catchAsync";
import { sendSuccess } from "@/utils/apiResponse";
import {
  getMyUnreadCountService,
  listMyNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from "./notification.service";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
  type ListNotificationsQuery,
} from "./notification.validation";

export const listMyNotificationsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const query = listNotificationsQuerySchema.parse(
      req.query,
    ) as ListNotificationsQuery;
    const result = await listMyNotificationsService(userId, query);
    sendSuccess({
      res,
      message: "Notifications fetched successfully",
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

export const getMyUnreadCountHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const count = await getMyUnreadCountService(userId);
    sendSuccess({
      res,
      message: "Unread count fetched successfully",
      data: { count },
    });
  },
);

export const markNotificationReadHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = notificationIdParamSchema.parse(req.params);
    await markNotificationReadService(userId, id);
    sendSuccess({
      res,
      message: "Notification marked as read",
      data: null,
    });
  },
);

export const markAllNotificationsReadHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const updated = await markAllNotificationsReadService(userId);
    sendSuccess({
      res,
      message: "Notifications marked as read",
      data: { updated },
    });
  },
);
