import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAbandonedCheckout extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  stripeSessionId: string;
  amount: number;
  currency: string;
  abandonedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const abandonedCheckoutSchema = new Schema<IAbandonedCheckout>(
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
    stripeSessionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "ngn" },
    abandonedAt: { type: Date, required: true, index: true },
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

abandonedCheckoutSchema.index({ abandonedAt: -1 });

export const AbandonedCheckout =
  (mongoose.models.AbandonedCheckout as mongoose.Model<IAbandonedCheckout>) ??
  mongoose.model<IAbandonedCheckout>(
    "AbandonedCheckout",
    abandonedCheckoutSchema,
  );
