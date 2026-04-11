import mongoose from "mongoose";
import { Payment, IPayment } from "./payment.model";

export interface CreatePaymentDto {
  studentId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: IPayment["status"];
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentMethodLast4?: string;
  paymentMethodBrand?: string;
  receiptUrl?: string;
  originalPrice?: number;
  discountAmount?: number;
  taxAmount?: number;
  paidAt: Date;
}

export function createPayment(dto: CreatePaymentDto): Promise<IPayment> {
  return Payment.create({
    student: new mongoose.Types.ObjectId(dto.studentId),
    course: new mongoose.Types.ObjectId(dto.courseId),
    amount: dto.amount,
    currency: dto.currency,
    status: dto.status,
    stripeSessionId: dto.stripeSessionId,
    stripePaymentIntentId: dto.stripePaymentIntentId,
    paymentMethodLast4: dto.paymentMethodLast4,
    paymentMethodBrand: dto.paymentMethodBrand,
    receiptUrl: dto.receiptUrl,
    originalPrice: dto.originalPrice,
    discountAmount: dto.discountAmount,
    taxAmount: dto.taxAmount,
    paidAt: dto.paidAt,
  });
}

export function findPaymentById(id: string): Promise<IPayment | null> {
  return Payment.findById(id).exec();
}

export function findPaymentByStripeSessionId(
  sessionId: string,
): Promise<IPayment | null> {
  return Payment.findOne({ stripeSessionId: sessionId }).exec();
}

/** Count succeeded payments by student and course (for first_payments discount rule). */
export function countSucceededPaymentsByStudentAndCourse(
  studentId: string,
  courseId: string,
): Promise<number> {
  return Payment.countDocuments({
    student: new mongoose.Types.ObjectId(studentId),
    course: new mongoose.Types.ObjectId(courseId),
    status: "succeeded",
  }).exec();
}

export async function findPaymentsPaginated(
  page: number,
  limit: number,
): Promise<{ payments: IPayment[]; total: number }> {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find({ status: "succeeded" })
      .populate("course", "title slug coverImage")
      .populate("student", "firstName lastName email")
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Payment.countDocuments({ status: "succeeded" }),
  ]);
  return { payments: payments as unknown as IPayment[], total };
}

export async function findStudentPaymentsPaginated(
  studentId: string,
  page: number,
  limit: number,
): Promise<{ payments: IPayment[]; total: number }> {
  const skip = (page - 1) * limit;
  const filter = {
    student: new mongoose.Types.ObjectId(studentId),
  };
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate("course", "title slug coverImage")
      .sort({ paidAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Payment.countDocuments(filter),
  ]);
  return { payments: payments as unknown as IPayment[], total };
}

export function updatePaymentRefund(
  id: string,
  refundedAt: Date,
  stripeRefundId?: string,
): Promise<IPayment | null> {
  return Payment.findByIdAndUpdate(
    id,
    {
      $set: {
        status: "refunded",
        refundedAt,
        ...(stripeRefundId && { stripeRefundId }),
      },
    },
    { new: true },
  ).exec();
}

/** Total revenue (succeeded, not refunded). */
export async function getTotalRevenue(): Promise<number> {
  const result = await Payment.aggregate([
    { $match: { status: "succeeded" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).exec();
  return result[0]?.total ?? 0;
}

/** Revenue per category (course.category) with label. */
export async function getRevenueByCategory(): Promise<
  {
    categoryId: mongoose.Types.ObjectId;
    total: number;
    categoryLabel: string;
  }[]
> {
  const result = await Payment.aggregate([
    { $match: { status: "succeeded" } },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "courseDoc",
      },
    },
    { $unwind: "$courseDoc" },
    { $group: { _id: "$courseDoc.category", total: { $sum: "$amount" } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "cat",
      },
    },
    { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
    { $sort: { total: -1 } },
    {
      $project: {
        categoryId: "$_id",
        total: 1,
        categoryLabel: { $ifNull: ["$cat.label", "Uncategorized"] },
      },
    },
  ]).exec();
  return result as any;
}
