import { Course, ICourse } from "@/modules/courses/course.model";

export async function findAllPublishedCoursesForAdvisory(): Promise<
  Pick<
    ICourse,
    | "_id"
    | "title"
    | "slug"
    | "summary"
    | "description"
    | "skillLevel"
    | "tags"
    | "estimatedCompletionTime"
    | "enrollmentCount"
    | "averageRating"
    | "totalRatings"
    | "isFree"
    | "coverImage"
    | "totalDuration"
    | "whatToLearn"
    | "requirements"
    | "hasQuizzes"
    | "hasCertificate"
    | "hasDownloadableResources"
  >[]
> {
  return Course.find({ status: "published" })
    .select(
      "title slug summary description skillLevel tags estimatedCompletionTime enrollmentCount averageRating totalRatings isFree coverImage totalDuration whatToLearn requirements hasQuizzes hasCertificate hasDownloadableResources",
    )
    .populate("category", "label")
    .populate("instructor", "firstName lastName")
    .lean()
    .exec() as any;
}
