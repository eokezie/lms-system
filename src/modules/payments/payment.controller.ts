import { Request, Response } from "express";
import { catchAsync } from "@/utils/catchAsync";
import { sendCreated, sendSuccess } from "@/utils/apiResponse";
import {
  createCheckoutSessionService,
  listPaymentsService,
  refundPaymentService,
  getPaymentStatsService,
} from "./payment.service";

/** Minimal type for Stripe checkout.session.completed event */
interface StripeCheckoutSession {
  id: string;
  client_reference_id: string | null;
  metadata: { courseId?: string; userId?: string } | null;
  amount_total: number | null;
  currency: string | null;
  payment_intent?: string | unknown;
}

export const createCheckoutSessionHandler = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { courseId, billingCountry } = req.body as {
      courseId: string;
      billingCountry?: string;
    };
    const { url, sessionId } = await createCheckoutSessionService(
      userId,
      courseId,
      billingCountry,
    );
    sendCreated({
      res,
      message: "Checkout session created",
      data: { url, sessionId },
    });
  },
);

export const stripeWebhookHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { handleCheckoutSessionCompleted } = await import("./payment.service");
  const stripe = (await import("@/libs/stripe")).getStripe();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !sig) {
    res.status(400).send("Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
    return;
  }
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).send("Webhook body must be raw buffer");
    return;
  }
  let event: { type: string; data: { object: StripeCheckoutSession } };
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret,
    ) as typeof event;
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  if (event.type === "checkout.session.completed") {
    await handleCheckoutSessionCompleted(event.data.object as any);
  }
  res.json({ received: true });
};

export const listPaymentsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { page, limit } = req.query as { page?: number; limit?: number };
    const result = await listPaymentsService(page ?? 1, limit ?? 20);
    sendSuccess({
      res,
      message: "Payments fetched successfully",
      data: result.payments,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  },
);

export const refundPaymentHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const adminId = req.user!.userId;
    const result = await refundPaymentService(id, adminId);
    sendSuccess({
      res,
      message: "Payment refunded successfully",
      data: result,
    });
  },
);

export const getPaymentStatsHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const stats = await getPaymentStatsService();
    sendSuccess({
      res,
      message: "Payment stats fetched successfully",
      data: stats,
    });
  },
);
