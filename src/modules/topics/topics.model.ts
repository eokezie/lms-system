import mongoose, { Document, Schema } from "mongoose";

export interface ITopics extends Document {
  _id: mongoose.Types.ObjectId;
  label: string;
  slug: string;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const topicsSchema = new Schema<ITopics>(
  {
    label: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Auto-generate slug from label if not provided
topicsSchema.pre("validate", function (next) {
  if (!this.slug && this.label) {
    this.slug = this.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  next();
});

export const Topics = mongoose.model<ITopics>("Topics", topicsSchema);
