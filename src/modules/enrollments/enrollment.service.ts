import { IEnrollment } from './enrollment.model';
import { enrollmentRepository } from './enrollment.repository';
import { courseRepository } from '@/modules/courses/course.repository';
import { ApiError } from '@/utils/apiError';
import { eventBus } from '@/events/eventBus';

class EnrollmentService {
  async enroll(studentId: string, courseId: string): Promise<IEnrollment> {
    const course = await courseRepository.findById(courseId);
    if (!course) throw ApiError.notFound('Course not found');
    if (course.status !== 'published') {
      throw ApiError.badRequest('This course is not available for enrollment');
    }

    const existing = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
    if (existing) {
      if (existing.status === 'dropped') {
        // Re-enroll: flip status back to active
        const reEnrolled = await enrollmentRepository.updateStatus(studentId, courseId, 'active', {
          enrolledAt: new Date(),
        });
        return reEnrolled!;
      }
      throw ApiError.conflict('You are already enrolled in this course');
    }

    const enrollment = await enrollmentRepository.create(studentId, courseId);
    await courseRepository.incrementEnrollmentCount(courseId);

    // Announce what happened — notification service and email queue react to this
    // This service doesn't know or care who's listening
    eventBus.emit('student.enrolled', { studentId, courseId });

    return enrollment;
  }

  async drop(studentId: string, courseId: string): Promise<void> {
    const enrollment = await enrollmentRepository.findActiveByStudentAndCourse(studentId, courseId);
    if (!enrollment) throw ApiError.notFound('Active enrollment not found');

    await enrollmentRepository.updateStatus(studentId, courseId, 'dropped');
    await courseRepository.decrementEnrollmentCount(courseId);

    eventBus.emit('student.unenrolled', { studentId, courseId });
  }

  async getStudentEnrollments(studentId: string): Promise<IEnrollment[]> {
    return enrollmentRepository.findAllByStudent(studentId);
  }

  async getCourseEnrollments(courseId: string, requesterId: string): Promise<IEnrollment[]> {
    const isOwner = await courseRepository.isOwnedByInstructor(courseId, requesterId);
    if (!isOwner) throw ApiError.forbidden('Only the course instructor can view enrollments');
    return enrollmentRepository.findAllByCourse(courseId);
  }

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    return enrollmentRepository.isEnrolled(studentId, courseId);
  }
}

export const enrollmentService = new EnrollmentService();
