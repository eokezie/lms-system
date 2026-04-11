import { Router } from "express";
import { authenticate, authorize } from "@/middleware/auth.middleware";
import { validate } from "@/middleware/validate";
import { USER_ROLES } from "@/modules/users/user.model";
import {
  createCheckoutSessionHandler,
  listPaymentsHandler,
  refundPaymentHandler,
  getPaymentStatsHandler,
  createSetupIntentHandler,
  listMyPaymentMethodsHandler,
  detachPaymentMethodHandler,
  listMyPaymentsHandler,
} from "./payment.controller";
import {
  createCheckoutSessionSchema,
  paymentIdParamSchema,
  listPaymentsQuerySchema,
  paymentMethodIdParamSchema,
} from "./payment.validation";

const router = Router();

router.post(
  "/checkout-session",
  authenticate,
  validate(createCheckoutSessionSchema),
  createCheckoutSessionHandler,
);

// --- Student-facing: payment history + saved cards ---
router.get(
  "/my",
  authenticate,
  validate(listPaymentsQuerySchema, "query"),
  listMyPaymentsHandler,
);

router.post("/setup-intent", authenticate, createSetupIntentHandler);

router.get("/methods", authenticate, listMyPaymentMethodsHandler);

router.delete(
  "/methods/:paymentMethodId",
  authenticate,
  validate(paymentMethodIdParamSchema, "params"),
  detachPaymentMethodHandler,
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
