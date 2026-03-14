import mongoose from "mongoose";
import { Rating, IRating } from "./rating.model";
import { CreateRatingDto, UpdateRatingDto } from "./rating.types";

export function createRating(
  courseId: string,
  userId: string,
  dto: CreateRatingDto,
): Promise<IRating> {
  return Rating.create({
    course: new mongoose.Types.ObjectId(courseId),
    user: new mongoose.Types.ObjectId(userId),
    rating: dto.rating,
    reviewText: dto.reviewText,
  });
}

export function findRatingById(ratingId: string): Promise<IRating | null> {
  return Rating.findById(ratingId).exec();
}

export function findRatingByCourseAndUser(
  courseId: string,
  userId: string,
): Promise<IRating | null> {
  return Rating.findOne({
    course: new mongoose.Types.ObjectId(courseId),
    user: new mongoose.Types.ObjectId(userId),
  }).exec();
}

export async function findRatingsByCoursePaginated(
  courseId: string,
  page: number,
  limit: number,
): Promise<{
  ratings: (IRating & {
    user?: {
      _id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  })[];
  total: number;
}> {
  const skip = (page - 1) * limit;
  const [ratings, total] = await Promise.all([
    Rating.find({ course: new mongoose.Types.ObjectId(courseId) })
      .populate("user", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Rating.countDocuments({ course: new mongoose.Types.ObjectId(courseId) }),
  ]);
  return { ratings: ratings as any, total };
}

export function updateRatingById(
  ratingId: string,
  dto: UpdateRatingDto,
): Promise<IRating | null> {
  return Rating.findByIdAndUpdate(
    ratingId,
    { $set: dto },
    { new: true, runValidators: true },
  ).exec();
}

export function deleteRatingById(ratingId: string): Promise<IRating | null> {
  return Rating.findByIdAndDelete(ratingId).exec();
}

/** Aggregation: average and count for a course. Single query. */
export async function getRatingStatsForCourse(
  courseId: string,
): Promise<{ averageRating: number; totalRatings: number }> {
  const result = await Rating.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]).exec();
  if (!result.length) return { averageRating: 0, totalRatings: 0 };
  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalRatings: result[0].totalRatings,
  };
}
