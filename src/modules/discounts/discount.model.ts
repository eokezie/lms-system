import mongoose, { Document, Schema } from "mongoose";

export type AppliesTo = "first_payments" | "all_payments";

export interface IDiscount extends Document {
  _id: mongoose.Types.ObjectId;
  /** null = apply to all courses */
  course: mongoose.Types.ObjectId | null;
  discountName: string;
  percentage: number;
  appliesTo: AppliesTo;
  expiresAt: Date;
  /** null = no limit on number of uses */
  purchaseLimit: number | null;
  displayOnDashboard: boolean;
  /** Number of times this discount has been used (for purchaseLimit). */
  timesUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    discountName: { type: String, required: true, trim: true, maxlength: 200 },
    percentage: { type: Number, required: true, min: 1, max: 100 },
    appliesTo: {
      type: String,
      enum: ["first_payments", "all_payments"],
      default: "all_payments",
    },
    expiresAt: { type: Date, required: true },
    purchaseLimit: { type: Number, default: null, min: 1 },
    displayOnDashboard: { type: Boolean, default: true },
    timesUsed: { type: Number, default: 0 },
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

discountSchema.index({ expiresAt: 1 });
discountSchema.index({ course: 1, expiresAt: 1 });

export const Discount =
  (mongoose.models.Discount as mongoose.Model<IDiscount>) ??
  mongoose.model<IDiscount>("Discount", discountSchema);
