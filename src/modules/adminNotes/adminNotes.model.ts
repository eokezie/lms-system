import mongoose, { Document, Schema } from "mongoose";

export type NoteTargetType = "post" | "comment";

export interface IAdminNotes extends Document {
  targetId: mongoose.Types.ObjectId;
  targetType: NoteTargetType;
  admin: mongoose.Types.ObjectId;
  note: string;
  createdAt: Date;
}

const adminNotesSchema = new Schema<IAdminNotes>(
  {
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "targetType",
    },
    targetType: {
      type: String,
      enum: ["post", "comment"],
      required: true,
    },
    admin: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, required: true },
  },
  { timestamps: true },
);

adminNotesSchema.index({ targetId: 1, targetType: 1 });

export const AdminNotes = mongoose.model<IAdminNotes>(
  "AdminNotes",
  adminNotesSchema,
);
