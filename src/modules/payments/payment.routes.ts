import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  createCheckoutSessionHandler,
  listPaymentsHandler,
  refundPaymentHandler,
  getPaymentStatsHandler,
} from "./payment.controller";
import {
  createCheckoutSessionSchema,
  paymentIdParamSchema,
  listPaymentsQuerySchema,
} from "./payment.validation";

const router = Router();

router.post(
  "/checkout-session",
  authenticate,
  validate(createCheckoutSessionSchema),
  createCheckoutSessionHandler,
);

router.get(
  "/",
  authenticate,
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(listPaymentsQuerySchema, "query"),
  listPaymentsHandler,
);

router.get(
  "/stats",
  authenticate,
  authorize(USER_ROLES[2], USER_ROLES[3]),
  getPaymentStatsHandler,
);

router.post(
  "/:id/refund",
  authenticate,
  authorize(USER_ROLES[2], USER_ROLES[3]),
  validate(paymentIdParamSchema, "params"),
  refundPaymentHandler,
);

export default router;
