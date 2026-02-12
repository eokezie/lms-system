import { Course, ICourse } from './course.model';
import { CreateCourseDto, UpdateCourseDto, CoursePaginationOptions } from './course.types';

class CourseRepository {
  findById(id: string): Promise<ICourse | null> {
    return Course.findById(id).exec();
  }

  findByIdWithInstructor(id: string): Promise<ICourse | null> {
    return Course.findById(id).populate('instructor', 'firstName lastName avatar').exec();
  }

  findBySlug(slug: string): Promise<ICourse | null> {
    return Course.findOne({ slug }).exec();
  }

  async findPaginated(options: CoursePaginationOptions): Promise<{
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

  findByInstructor(instructorId: string): Promise<ICourse[]> {
    return Course.find({ instructor: instructorId }).sort({ createdAt: -1 }).exec();
  }

  create(instructorId: string, dto: CreateCourseDto): Promise<ICourse> {
    return Course.create({
      ...dto,
      instructor: instructorId,
      isFree: dto.price === 0 || dto.isFree,
    });
  }

  updateById(id: string, dto: UpdateCourseDto): Promise<ICourse | null> {
    return Course.findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true }).exec();
  }

  incrementEnrollmentCount(courseId: string): Promise<ICourse | null> {
    return Course.findByIdAndUpdate(
      courseId,
      { $inc: { enrollmentCount: 1 } },
      { new: true },
    ).exec();
  }

  decrementEnrollmentCount(courseId: string): Promise<ICourse | null> {
    return Course.findByIdAndUpdate(
      courseId,
      { $inc: { enrollmentCount: -1 } },
      { new: true },
    ).exec();
  }

  isOwnedByInstructor(courseId: string, instructorId: string): Promise<boolean> {
    return Course.exists({ _id: courseId, instructor: instructorId }).then(Boolean);
  }
}

export const courseRepository = new CourseRepository();
