import {
  createCourseBookmark,
  deleteCourseBookmark,
  findStudentBookmarkedCourseIds,
  findStudentBookmarksPaginated,
} from "./bookmark.repository";
import type { ListBookmarksQuery } from "./bookmark.validation";

export async function addCourseBookmarkService(
  studentId: string,
  courseId: string,
) {
  return createCourseBookmark(studentId, courseId);
}

export async function removeCourseBookmarkService(
  studentId: string,
  courseId: string,
) {
  return deleteCourseBookmark(studentId, courseId);
}

export async function listMyCourseBookmarksService(
  studentId: string,
  query: ListBookmarksQuery,
) {
  return findStudentBookmarksPaginated(studentId, query);
}

export async function listMyBookmarkedCourseIdsService(studentId: string) {
  return findStudentBookmarkedCourseIds(studentId);
}
