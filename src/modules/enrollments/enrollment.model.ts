import mongoose, { Document, Schema } from 'mongoose';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface IEnrollment extends Document {
  _id: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  paymentRef?: string;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    paymentRef: { type: String },
  },
  {
    timestamps: true,
    toJSON: { transform(_doc, ret) { delete ret.__v; return ret; } },
  },
);

// A student can only be enrolled once per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
