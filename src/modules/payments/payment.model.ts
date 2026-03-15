import mongoose, { Document, Schema } from "mongoose";

export type PaymentStatus = "succeeded" | "refunded" | "failed" | "pending";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentMethodLast4?: string;
  paymentMethodBrand?: string;
  receiptUrl?: string;
  originalPrice?: number;
  discountAmount?: number;
  taxAmount?: number;
  paidAt: Date;
  refundedAt?: Date;
  stripeRefundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ngn" },
    status: {
      type: String,
      enum: ["succeeded", "refunded", "failed", "pending"],
      default: "pending",
      index: true,
    },
    stripeSessionId: { type: String, sparse: true, unique: true },
    stripePaymentIntentId: { type: String, index: true },
    paymentMethodLast4: { type: String },
    paymentMethodBrand: { type: String },
    receiptUrl: { type: String },
    originalPrice: { type: Number },
    discountAmount: { type: Number },
    taxAmount: { type: Number },
    paidAt: { type: Date, required: true },
    refundedAt: { type: Date },
    stripeRefundId: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

paymentSchema.index({ course: 1, paidAt: -1 });
paymentSchema.index({ student: 1, paidAt: -1 });

export const Payment =
  (mongoose.models.Payment as mongoose.Model<IPayment>) ??
  mongoose.model<IPayment>("Payment", paymentSchema);
