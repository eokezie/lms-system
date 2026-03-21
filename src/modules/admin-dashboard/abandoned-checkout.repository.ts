import mongoose from "mongoose";
import { AbandonedCheckout } from "./abandoned-checkout.model";

export async function createAbandonedCheckoutRecord(data: {
  studentId: string;
  courseId: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  abandonedAt: Date;
}): Promise<void> {
  try {
    await AbandonedCheckout.create({
      student: new mongoose.Types.ObjectId(data.studentId),
      course: new mongoose.Types.ObjectId(data.courseId),
      stripeSessionId: data.stripeSessionId,
      amount: data.amount,
      currency: data.currency.toLowerCase(),
      abandonedAt: data.abandonedAt,
    });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) return;
    throw err;
  }
}
