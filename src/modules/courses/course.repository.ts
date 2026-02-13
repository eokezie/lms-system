import { Course, ICourse } from './course.model';
import { CreateCourseDto, UpdateCourseDto, CoursePaginationOptions } from './course.types';

export function findCourseById(id: string): Promise<ICourse | null> {
  return Course.findById(id).exec();
}

export function findCourseByIdWithInstructor(id: string): Promise<ICourse | null> {
  return Course.findById(id).populate('instructor', 'firstName lastName avatar').exec();
}

export function findCourseBySlug(slug: string): Promise<ICourse | null> {
  return Course.findOne({ slug }).exec();
}

export async function findCoursesPaginated(options: CoursePaginationOptions): Promise<{
  courses: ICourse[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { page = 1, limit = 20, category, status = 'published', search } = options;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { status };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'firstName lastName avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec(),
    Course.countDocuments(filter),
  ]);

  return { courses, total, page, totalPages: Math.ceil(total / limit) };
}

export function findCoursesByInstructor(instructorId: string): Promise<ICourse[]> {
  return Course.find({ instructor: instructorId }).sort({ createdAt: -1 }).exec();
}

export function createCourse(instructorId: string, dto: CreateCourseDto): Promise<ICourse> {
  return Course.create({
    ...dto,
    instructor: instructorId,
    isFree: dto.price === 0 || dto.isFree,
  });
}

export function updateCourseById(id: string, dto: UpdateCourseDto): Promise<ICourse | null> {
  return Course.findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true }).exec();
}

export function incrementCourseEnrollmentCount(courseId: string): Promise<ICourse | null> {
  return Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } }, { new: true }).exec();
}

export function decrementCourseEnrollmentCount(courseId: string): Promise<ICourse | null> {
  return Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: -1 } }, { new: true }).exec();
}

export async function isCourseOwnedByInstructor(
  courseId: string,
  instructorId: string,
): Promise<boolean> {
  const doc = await Course.exists({ _id: courseId, instructor: instructorId });
  return !!doc;
}
