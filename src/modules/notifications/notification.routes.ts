import { Router } from "express";

import { authenticate } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import {
  getMyUnreadCountHandler,
  listMyNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "./notification.controller";
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from "./notification.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(listNotificationsQuerySchema, "query"),
  listMyNotificationsHandler,
);

router.get("/unread-count", getMyUnreadCountHandler);

router.patch("/read-all", markAllNotificationsReadHandler);

router.patch(
  "/:id/read",
  validate(notificationIdParamSchema, "params"),
  markNotificationReadHandler,
);

export default router;
