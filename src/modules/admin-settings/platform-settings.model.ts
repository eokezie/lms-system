import mongoose, { Document, Schema } from "mongoose";

export type DiscountLimitType = "any" | "specific" | "none";

export interface IPlatformSettings extends Document {
  _id: mongoose.Types.ObjectId;
  /** Singleton key */
  key: string;
  courseSettings: {
    quizPassMarkPercent: number;
    discountLimitType: DiscountLimitType;
    discountLimitAmount: number | null;
    maxDiscountPercent: number;
  };
  instructorProfileDefaults: Record<string, unknown>;
  updatedAt: Date;
}

const platformSettingsSchema = new Schema<IPlatformSettings>(
  {
    key: { type: String, default: "default", unique: true, index: true },
    courseSettings: {
      quizPassMarkPercent: { type: Number, default: 80, min: 0, max: 100 },
      discountLimitType: {
        type: String,
        enum: ["any", "specific", "none"],
        default: "any",
      },
      discountLimitAmount: { type: Number, default: null, min: 0 },
      maxDiscountPercent: { type: Number, default: 50, min: 0, max: 100 },
    },
    instructorProfileDefaults: { type: Schema.Types.Mixed, default: {} },
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

export const PlatformSettings =
  (mongoose.models.PlatformSettings as mongoose.Model<IPlatformSettings>) ??
  mongoose.model<IPlatformSettings>("PlatformSettings", platformSettingsSchema);
