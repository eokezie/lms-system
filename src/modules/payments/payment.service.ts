import { ApiError } from "@/utils/apiError";
import { logger } from "@/utils/logger";
import {
  getStripe,
  isStripeConfigured,
  formatAmountForStripe,
  formatAmountFromStripe,
} from "@/libs/stripe";
import { env } from "@/config/env";
import {
  createPayment,
  findPaymentByStripeSessionId,
  findPaymentById,
  findPaymentsPaginated,
  findStudentPaymentsPaginated,
  updatePaymentRefund,
  getTotalRevenue,
  getRevenueByCategory,
  countSucceededPaymentsByStudentAndCourse,
} from "./payment.repository";
import { updateUserById } from "@/modules/users/user.repository";
import { createAbandonedCheckoutRecord } from "@/modules/admin-dashboard/abandoned-checkout.repository";
import { findCourseById } from "@/modules/courses/course.repository";
import {
  findActiveDiscountForCourse,
  incrementDiscountTimesUsed,
} from "@/modules/discounts/discount.repository";
import { findUserById } from "@/modules/users/user.repository";
import {
  createEnrollment,
  findEnrollmentByStudentAndCourse,
} from "@/modules/enrollments/enrollment.repository";
import { incrementCourseEnrollmentCount } from "@/modules/courses/course.repository";
import { createEmailQueue } from "@/queues/email.queue";
import { redisConnection } from "@/config/redis";
import Stripe from "stripe";

const emailQueue = createEmailQueue(redisConnection);

export function checkoutEnabled(): boolean {
  return (
    isStripeConfigured() &&
    Boolean(env.STRIPE_SUCCESS_URL && env.STRIPE_CANCEL_URL)
  );
}

export async function createCheckoutSessionService(
  userId: string,
  courseId: string,
  billingCountry?: string,
) {
  if (!checkoutEnabled())
    throw ApiError.badRequest("Checkout is not configured");
  const course = await findCourseById(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  if (course.status !== "published")
    throw ApiError.badRequest("Course is not available for purchase");
  const existing = await findEnrollmentByStudentAndCourse(userId, courseId);
  if (existing && existing.status === "active")
    throw ApiError.conflict("You are already enrolled in this course");

  // Decide which regional price & currency to use based on billing country.
  const isNigeria = (billingCountry || "").toUpperCase() === "NG";
  const priceNGN =
    (course as any).priceNGN != null
      ? (course as any).priceNGN
      : (course.price ?? 0);
  const priceUSD = (course as any).priceUSD ?? 0;

  const price = isNigeria ? priceNGN : priceUSD || priceNGN;
  if (price <= 0)
    throw ApiError.badRequest("This course is free; use enroll instead");

  const discount = await findActiveDiscountForCourse(courseId);
  let finalPrice = price;
  let discountId: string | undefined;
  if (discount) {
    const d = discount as {
      _id: unknown;
      percentage: number;
      appliesTo: string;
    };
    if (d.appliesTo === "first_payments") {
      const count = await countSucceededPaymentsByStudentAndCourse(
        userId,
        courseId,
      );
      if (count >= 1) {
        // Not eligible: already paid before
      } else {
        const reduction = (price * d.percentage) / 100;
        finalPrice = Math.max(0, price - reduction);
        discountId = d._id != null ? String(d._id) : undefined;
      }
    } else {
      const reduction = (price * d.percentage) / 100;
      finalPrice = Math.max(0, price - reduction);
      discountId = d._id != null ? String(d._id) : undefined;
    }
  }

  const stripe = getStripe();
  const currency = (isNigeria ? "ngn" : "usd").toLowerCase();
  const amount = formatAmountForStripe(finalPrice, currency);

  const imageUrl =
    typeof course.coverImage === "string" &&
    /^https?:\/\//i.test(course.coverImage)
      ? course.coverImage
      : undefined;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: course.title,
            description: course.summary?.slice(0, 300) || undefined,
            images: imageUrl ? [imageUrl] : undefined,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: env.STRIPE_CANCEL_URL!,
    client_reference_id: userId,
    metadata: { courseId, userId, ...(discountId && { discountId }) },
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  return { url: session.url!, sessionId: session.id };
}

export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (!session.client_reference_id || !session.metadata?.courseId) {
    logger.warn(
      { sessionId: session.id },
      "[payment] Missing client_reference_id or metadata.courseId",
    );
    return;
  }
  const userId = session.client_reference_id;
  const courseId = session.metadata.courseId as string;

  const existingPayment = await findPaymentByStripeSessionId(session.id);
  if (existingPayment) {
    logger.info(
      { sessionId: session.id },
      "[payment] Payment already recorded, skipping",
    );
    return;
  }

  const amountTotal = session.amount_total ?? 0;
  const currency = (session.currency ?? "ngn").toLowerCase();
  // Stripe returns amounts in the smallest currency unit (minor units).
  // We store/display major units in our DB.
  const amountMajor = formatAmountFromStripe(amountTotal, currency);

  let paymentMethodLast4: string | undefined;
  let paymentMethodBrand: string | undefined;
  let receiptUrl: string | undefined;
  let stripePaymentIntentId: string | undefined;

  const stripe = getStripe();
  if (session.payment_intent) {
    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent as Stripe.PaymentIntent).id;
    stripePaymentIntentId = piId;
    try {
      const pi = await stripe.paymentIntents.retrieve(piId, {
        expand: ["latest_charge"],
      });
      const charge = pi.latest_charge as Stripe.Charge | undefined;
      if (charge?.receipt_url) receiptUrl = charge.receipt_url;
      const pm = pi.payment_method;
      if (pm && typeof pm === "object" && pm.type === "card" && pm.card) {
        paymentMethodLast4 = (pm.card as { last4?: string }).last4;
        paymentMethodBrand = (pm.card as { brand?: string }).brand;
      }
    } catch (e) {
      logger.warn(
        { err: e, paymentIntentId: piId },
        "[payment] Could not retrieve payment intent details",
      );
    }
  }

  const payment = await createPayment({
    studentId: userId,
    courseId,
    amount: amountMajor,
    currency,
    status: "succeeded",
    stripeSessionId: session.id,
    stripePaymentIntentId,
    paymentMethodLast4,
    paymentMethodBrand,
    receiptUrl,
    originalPrice: amountMajor,
    paidAt: new Date(),
  });

  await createEnrollment(userId, courseId, payment._id.toString());
  await incrementCourseEnrollmentCount(courseId);

  const [user, course] = await Promise.all([
    findUserById(userId),
    findCourseById(courseId),
  ]);
  const email = user?.email;
  const courseName = course?.title ?? "Your course";
  const courseLink = course
    ? `${env.BACKEND_BASE_URL || ""}/courses/${course.slug || courseId}`
    : "#";
  const courseImageUrl = course?.coverImage
    ? String(course.coverImage)
    : undefined;
  const providerName = "Infinix Tech";
  const amountFormatted = formatCurrency(amountMajor, currency);
  const paymentDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (email) {
    await emailQueue.add(
      "payment-confirmation",
      {
        template: "payment-confirmation",
        email,
        firstName: user?.firstName ?? "there",
        courseName,
        courseLink,
        amount: amountFormatted,
        transactionId: payment._id.toString(),
        paymentDate,
        total: amountFormatted,
        receiptUrl: payment.receiptUrl,
        courseImageUrl,
        providerName,
      },
      { attempts: 3 },
    );
    await emailQueue.add(
      "enrollment-confirmation",
      {
        template: "enrollment-confirmation",
        email,
        firstName: user?.firstName ?? "there",
        courseName,
        courseLink,
        courseImageUrl,
        providerName,
      },
      { attempts: 3 },
    );
  }

  const discountId = session.metadata?.discountId;
  if (discountId) {
    try {
      await incrementDiscountTimesUsed(discountId);
    } catch (e) {
      logger.warn(
        { discountId, err: e },
        "[payment] Failed to increment discount usage",
      );
    }
  }

  logger.info(
    { paymentId: payment._id, courseId, userId },
    "[payment] Payment recorded and enrollment created",
  );
}

/** Persist abandoned checkout when Stripe sends checkout.session.expired (for analytics). */
export async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (!session.client_reference_id || !session.metadata?.courseId) {
    logger.warn(
      { sessionId: session.id },
      "[payment] checkout.session.expired missing metadata",
    );
    return;
  }
  const existingPayment = await findPaymentByStripeSessionId(session.id);
  if (existingPayment) return;

  const currency = (session.currency ?? "ngn").toLowerCase();
  const amount = formatAmountFromStripe(
    session.amount_total ?? 0,
    currency,
  );

  await createAbandonedCheckoutRecord({
    studentId: session.client_reference_id,
    courseId: session.metadata.courseId as string,
    stripeSessionId: session.id,
    amount,
    currency,
    abandonedAt: new Date(),
  });
  logger.info(
    { sessionId: session.id, courseId: session.metadata.courseId },
    "[payment] Abandoned checkout recorded",
  );
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === "ngn") return `₦${Number(amount).toLocaleString("en-NG")}`;
  return `${currency.toUpperCase()} ${amount.toLocaleString()}`;
}

export async function listPaymentsService(page: number, limit: number) {
  const { payments, total } = await findPaymentsPaginated(page, limit);
  return {
    payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function refundPaymentService(
  paymentId: string,
  _adminId: string,
): Promise<{ refunded: boolean }> {
  const payment = await findPaymentById(paymentId);
  if (!payment) throw ApiError.notFound("Payment not found");
  if (payment.status === "refunded")
    throw ApiError.badRequest("Payment is already refunded");
  if (payment.status !== "succeeded")
    throw ApiError.badRequest("Payment cannot be refunded");

  const stripe = getStripe();
  const paymentIntentId = payment.stripePaymentIntentId;
  if (!paymentIntentId)
    throw ApiError.badRequest(
      "Payment has no Stripe PaymentIntent; cannot refund via Stripe",
    );

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = paymentIntent.latest_charge;
  if (!chargeId || typeof chargeId !== "string") {
    throw ApiError.badRequest("No charge found for this payment");
  }

  const refund = await stripe.refunds.create({ charge: chargeId });
  await updatePaymentRefund(paymentId, new Date(), refund.id);
  logger.info({ paymentId, refundId: refund.id }, "[payment] Payment refunded");
  return { refunded: true };
}

export async function getPaymentStatsService() {
  const [totalRevenue, byCategory] = await Promise.all([
    getTotalRevenue(),
    getRevenueByCategory(),
  ]);
  return {
    totalRevenue,
    revenueByCategory: byCategory,
  };
}

// ---------------------------------------------------------------------------
// Student-facing: payment history + saved cards
// ---------------------------------------------------------------------------

export async function getOrCreateStripeCustomerForUser(
  userId: string,
): Promise<string> {
  if (!isStripeConfigured()) {
    throw ApiError.badRequest("Payments are not configured");
  }
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined,
    metadata: { userId },
  });

  await updateUserById(userId, { stripeCustomerId: customer.id } as any);
  logger.info(
    { userId, stripeCustomerId: customer.id },
    "[payment] Created Stripe customer",
  );
  return customer.id;
}

export async function createSetupIntentService(userId: string) {
  const customerId = await getOrCreateStripeCustomerForUser(userId);
  const stripe = getStripe();
  const intent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
  });
  return { clientSecret: intent.client_secret, customerId };
}

export async function listMyPaymentMethodsService(userId: string) {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (!user.stripeCustomerId) return [];

  const stripe = getStripe();
  const result = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: "card",
  });

  return result.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand ?? "card",
    last4: pm.card?.last4 ?? "",
    expMonth: pm.card?.exp_month ?? null,
    expYear: pm.card?.exp_year ?? null,
  }));
}

export async function detachPaymentMethodService(
  userId: string,
  paymentMethodId: string,
) {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");
  if (!user.stripeCustomerId) {
    throw ApiError.notFound("Payment method not found");
  }
  const stripe = getStripe();
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (pm.customer !== user.stripeCustomerId) {
    throw ApiError.forbidden("Payment method does not belong to this user");
  }
  await stripe.paymentMethods.detach(paymentMethodId);
}

export async function listMyPaymentsService(
  userId: string,
  page: number,
  limit: number,
) {
  const { payments, total } = await findStudentPaymentsPaginated(
    userId,
    page,
    limit,
  );
  return {
    payments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
