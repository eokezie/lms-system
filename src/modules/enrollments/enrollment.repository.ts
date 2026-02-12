import { Enrollment, IEnrollment } from './enrollment.model';

class EnrollmentRepository {
  findById(id: string): Promise<IEnrollment | null> {
    return Enrollment.findById(id).exec();
  }

  findByStudentAndCourse(studentId: string, courseId: string): Promise<IEnrollment | null> {
    return Enrollment.findOne({ student: studentId, course: courseId }).exec();
  }

  findActiveByStudentAndCourse(studentId: string, courseId: string): Promise<IEnrollment | null> {
    return Enrollment.findOne({ student: studentId, course: courseId, status: 'active' }).exec();
  }

  findAllByStudent(studentId: string): Promise<IEnrollment[]> {
    return Enrollment.find({ student: studentId, status: 'active' })
      .populate('course', 'title slug coverImage instructor')
      .sort({ enrolledAt: -1 })
      .exec();
  }

  findAllByCourse(courseId: string): Promise<IEnrollment[]> {
    return Enrollment.find({ course: courseId })
      .populate('student', 'firstName lastName email')
      .sort({ enrolledAt: -1 })
      .exec();
  }

  isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    return Enrollment.exists({ student: studentId, course: courseId, status: 'active' }).then(Boolean);
  }

  create(studentId: string, courseId: string, paymentRef?: string): Promise<IEnrollment> {
    return Enrollment.create({
      student: studentId,
      course: courseId,
      ...(paymentRef && { paymentRef }),
    });
  }

  updateStatus(
    studentId: string,
    courseId: string,
    status: IEnrollment['status'],
    extra?: Partial<IEnrollment>,
  ): Promise<IEnrollment | null> {
    return Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $set: { status, ...extra } },
      { new: true },
    ).exec();
  }
}

export const enrollmentRepository = new EnrollmentRepository();
