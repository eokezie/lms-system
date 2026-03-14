import { ApiError } from "@/utils/apiError";
import { logger } from "@/utils/logger";
import {
  CreateRatingDto,
  UpdateRatingDto,
  GetRatingsQuery,
} from "./rating.types";
import {
  createRating,
  findRatingById,
  findRatingByCourseAndUser,
  findRatingsByCoursePaginated,
  updateRatingById,
  deleteRatingById,
  getRatingStatsForCourse,
} from "./rating.repository";
import {
  findCourseByIdOrSlugForStudent,
  updateCourseRatingStats,
} from "../courses/course.repository";

async function recalcAndUpdateCourseStats(courseId: string): Promise<void> {
  const { averageRating, totalRatings } =
    await getRatingStatsForCourse(courseId);
  await updateCourseRatingStats(courseId, averageRating, totalRatings);
}

export async function createRatingService(
  courseId: string,
  userId: string,
  dto: CreateRatingDto,
) {
  const course = await findCourseByIdOrSlugForStudent(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  const courseIdObj = (course as any)._id.toString();

  const existing = await findRatingByCourseAndUser(courseIdObj, userId);
  let rating;
  if (existing) {
    rating = await updateRatingById(existing._id.toString(), {
      rating: dto.rating,
      reviewText: dto.reviewText,
    });
    if (!rating) throw ApiError.notFound("Rating not found");
  } else {
    rating = await createRating(courseIdObj, userId, dto);
  }
  await recalcAndUpdateCourseStats(courseIdObj);
  logger.info(
    { courseId: courseIdObj, userId, ratingId: rating._id },
    "Rating created or updated",
  );
  return rating;
}

export async function getRatingsForCourseService(
  courseId: string,
  query: GetRatingsQuery,
) {
  const course = await findCourseByIdOrSlugForStudent(courseId);
  if (!course) throw ApiError.notFound("Course not found");
  const courseIdObj = (course as any)._id.toString();

  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const [stats, { ratings, total }] = await Promise.all([
    getRatingStatsForCourse(courseIdObj),
    findRatingsByCoursePaginated(courseIdObj, page, limit),
  ]);
  return {
    averageRating: stats.averageRating,
    totalRatings: stats.totalRatings,
    ratings,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateRatingService(
  ratingId: string,
  userId: string,
  dto: UpdateRatingDto,
) {
  const rating = await findRatingById(ratingId);
  if (!rating) throw ApiError.notFound("Rating not found");
  if (rating.user.toString() !== userId)
    throw ApiError.forbidden("You can only update your own rating");
  const updated = await updateRatingById(ratingId, dto);
  if (!updated) throw ApiError.notFound("Rating not found");
  await recalcAndUpdateCourseStats(updated.course.toString());
  logger.info({ ratingId, userId }, "Rating updated");
  return updated;
}

export async function deleteRatingService(ratingId: string, userId: string) {
  const rating = await findRatingById(ratingId);
  if (!rating) throw ApiError.notFound("Rating not found");
  if (rating.user.toString() !== userId)
    throw ApiError.forbidden("You can only delete your own rating");
  const courseId = rating.course.toString();
  await deleteRatingById(ratingId);
  await recalcAndUpdateCourseStats(courseId);
  logger.info({ ratingId, userId }, "Rating deleted");
  return { deleted: true };
}
