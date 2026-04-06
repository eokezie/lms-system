import mongoose, { Document, Schema } from "mongoose";

export interface ICommentsFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export interface IComments extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;

  content?: string; // optional if file exists
  file?: ICommentsFile;

  isFlagged: boolean;
  flaggedBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const commentsSchema = new Schema<IComments>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", index: true },

    content: { type: String },
    file: {
      fileName: String,
      fileType: String,
      fileSize: Number,
      fileUrl: String,
    },

    isFlagged: { type: Boolean, default: false },
    flaggedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Ensure at least content OR file exists
// commentSchema.pre("validate", function (next) {
//   if (!this.content && !this.file) {
//     return next(new Error("Comment must have content or a file"));
//   }
//   next();
// });

export const Comments = mongoose.model<IComments>("Comments", commentsSchema);
