import mongoose, { Document, Schema } from "mongoose";

/** Row-level flags aligned with admin UI matrix. */
export type PermissionFlags = {
  view?: boolean;
  edit?: boolean;
  manageTopics?: boolean;
};

export interface IAdminRole extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon?: string;
  builtIn: boolean;
  /** Keyed by stable permission id, e.g. home.access */
  permissions: Record<string, PermissionFlags>;
  createdAt: Date;
  updatedAt: Date;
}

const adminRoleSchema = new Schema<IAdminRole>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500 },
    icon: { type: String, trim: true, maxlength: 64 },
    builtIn: { type: Boolean, default: false },
    permissions: { type: Schema.Types.Mixed, default: {} },
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

adminRoleSchema.index({ name: 1 });

export const AdminRole =
  (mongoose.models.AdminRole as mongoose.Model<IAdminRole>) ??
  mongoose.model<IAdminRole>("AdminRole", adminRoleSchema);
