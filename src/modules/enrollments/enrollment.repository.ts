import { Enrollment, IEnrollment } from './enrollment.model';

export function findEnrollmentById(id: string): Promise<IEnrollment | null> {
  return Enrollment.findById(id).exec();
}

export function findEnrollmentByStudentAndCourse(
  studentId: string,
  courseId: string,
): Promise<IEnrollment | null> {
  return Enrollment.findOne({ student: studentId, course: courseId }).exec();
}

export function findActiveEnrollment(
  studentId: string,
  courseId: string,
): Promise<IEnrollment | null> {
  return Enrollment.findOne({ student: studentId, course: courseId, status: 'active' }).exec();
}

export function findEnrollmentsByStudent(studentId: string): Promise<IEnrollment[]> {
  return Enrollment.find({ student: studentId, status: 'active' })
    .populate('course', 'title slug coverImage instructor')
    .sort({ enrolledAt: -1 })
    .exec();
}

export function findEnrollmentsByCourse(courseId: string): Promise<IEnrollment[]> {
  return Enrollment.find({ course: courseId })
    .populate('student', 'firstName lastName email')
    .sort({ enrolledAt: -1 })
    .exec();
}

export async function isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
  const doc = await Enrollment.exists({ student: studentId, course: courseId, status: 'active' });
  return !!doc;
}

export function createEnrollment(
  studentId: string,
  courseId: string,
  paymentRef?: string,
): Promise<IEnrollment> {
  return Enrollment.create({
    student: studentId,
    course: courseId,
    ...(paymentRef && { paymentRef }),
  });
}

export function updateEnrollmentStatus(
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
