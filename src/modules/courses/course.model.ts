import mongoose, { Document, Schema } from 'mongoose';

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface ICourseSection {
  sectionTitle: string;
  lessons: mongoose.Types.ObjectId[];
}

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  instructor: mongoose.Types.ObjectId;
  category: string;
  tags: string[];
  status: CourseStatus;
  price: number;
  isFree: boolean;
  curriculum: ICourseSection[];
  enrollmentCount: number;
  averageRating: number;
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
}

const courseSectionSchema = new Schema<ICourseSection>(
  {
    sectionTitle: { type: String, required: true },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
  },
  { _id: false },
);

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true, maxlength: 5000 },
    coverImage: { type: String },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    price: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: true },
    curriculum: [courseSectionSchema],
    enrollmentCount: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform(_doc, ret) { delete ret.__v; return ret; } },
  },
);

// Auto-generate slug from title if not provided
courseSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

export const Course = mongoose.model<ICourse>('Course', courseSchema);
