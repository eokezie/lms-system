import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILessonNote extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const lessonNoteSchema = new Schema<ILessonNote>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lesson: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    content: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

lessonNoteSchema.index({ student: 1, lesson: 1, createdAt: -1 });
lessonNoteSchema.index({ course: 1, lesson: 1 });

export const LessonNote = mongoose.model<ILessonNote>(
  "LessonNote",
  lessonNoteSchema,
);
