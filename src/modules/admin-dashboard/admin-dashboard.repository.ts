import mongoose from "mongoose";
import { User } from "@/modules/users/user.model";
import { Course } from "@/modules/courses/course.model";
import { Enrollment } from "@/modules/enrollments/enrollment.model";
import { Payment } from "@/modules/payments/payment.model";
import { AbandonedCheckout } from "./abandoned-checkout.model";

/** NGN-only payments (Stripe stores lowercase; legacy rows may be uppercase). */
const NGN_MATCH = {
  $or: [{ currency: "ngn" }, { currency: "NGN" }],
};

/** `undefined` = full system. `{ courseIds }` = instructor-scoped (their courses only). */
export type MetricScope = { courseIds: mongoose.Types.ObjectId[] } | undefined;

function courseFilter(
  courseIds: mongoose.Types.ObjectId[] | undefined,
): Record<string, unknown> {
  if (courseIds === undefined) return {};
  return { course: { $in: courseIds } };
}

export async function fetchCourseIdsForInstructor(
  instructorId: string,
): Promise<mongoose.Types.ObjectId[]> {
  const docs = await Course.find({
    instructor: new mongoose.Types.ObjectId(instructorId),
  })
    .select("_id")
    .lean()
    .exec();
  return docs.map((d) => d._id);
}

export function parseInclusiveUtcRange(
  startDateStr: string,
  endDateStr: string,
): { start: Date; end: Date } {
  const start =
    startDateStr.length === 10
      ? new Date(`${startDateStr}T00:00:00.000Z`)
      : new Date(startDateStr);
  const end =
    endDateStr.length === 10
      ? new Date(`${endDateStr}T23:59:59.999Z`)
      : new Date(endDateStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date range");
  }
  return { start, end };
}

/** Rolling windows for revenue growth (UTC). */
export function getRolling30DayBounds(): {
  last30Start: Date;
  last30End: Date;
  prev30Start: Date;
  prev30End: Date;
} {
  const last30End = new Date();
  const last30Start = new Date(last30End.getTime() - 30 * 86400000);
  const prev30End = new Date(last30Start.getTime() - 1);
  const prev30Start = new Date(prev30End.getTime() - 30 * 86400000);
  return { last30Start, last30End, prev30Start, prev30End };
}

export async function countStudents(scope: MetricScope): Promise<number> {
  const courseIds = scope?.courseIds;
  if (courseIds !== undefined) {
    if (courseIds.length === 0) return 0;
    const ids = await Enrollment.distinct("student", {
      course: { $in: courseIds },
    });
    return ids.length;
  }
  return User.countDocuments({ role: "student" }).exec();
}

export async function countActiveStudents(scope: MetricScope): Promise<number> {
  const courseIds = scope?.courseIds;
  if (courseIds !== undefined) {
    if (courseIds.length === 0) return 0;
    const ids = await Enrollment.distinct("student", {
      course: { $in: courseIds },
      status: "active",
    });
    return ids.length;
  }
  const ids = await Enrollment.distinct("student", { status: "active" });
  return ids.length;
}

export async function countCourses(scope: MetricScope): Promise<number> {
  const courseIds = scope?.courseIds;
  if (courseIds !== undefined) return courseIds.length;
  return Course.countDocuments({}).exec();
}

export async function countNonDroppedEnrollments(
  scope: MetricScope,
): Promise<number> {
  const courseIds = scope?.courseIds;
  if (courseIds !== undefined) {
    if (courseIds.length === 0) return 0;
    return Enrollment.countDocuments({
      course: { $in: courseIds },
      status: { $in: ["active", "completed"] },
    }).exec();
  }
  return Enrollment.countDocuments({
    status: { $in: ["active", "completed"] },
  }).exec();
}

export async function getAverageCompletionPercent(
  scope: MetricScope,
): Promise<number> {
  const courseIds = scope?.courseIds;
  const base: Record<string, unknown> = {
    status: { $in: ["active", "completed"] },
  };
  if (courseIds !== undefined) {
    if (courseIds.length === 0) return 0;
    Object.assign(base, { course: { $in: courseIds } });
  }
  const result = await Enrollment.aggregate([
    { $match: base },
    {
      $group: {
        _id: null,
        avg: { $avg: "$progressPercent" },
      },
    },
  ]).exec();
  const raw = result[0]?.avg ?? 0;
  return Math.round(raw * 10) / 10;
}

export async function getTotalRevenueNgn(scope: MetricScope): Promise<number> {
  const courseIds = scope?.courseIds;
  const result = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",
        ...NGN_MATCH,
        ...courseFilter(courseIds),
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).exec();
  return result[0]?.total ?? 0;
}

export async function sumRevenueNgnBetween(
  start: Date,
  end: Date,
  scope: MetricScope,
): Promise<number> {
  const courseIds = scope?.courseIds;
  const result = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",
        ...NGN_MATCH,
        paidAt: { $gte: start, $lte: end },
        ...courseFilter(courseIds),
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]).exec();
  return result[0]?.total ?? 0;
}

/** Revenue by category (NGN only) for dashboard breakdown. */
export async function getRevenueByCategoryNgn(scope: MetricScope): Promise<
  {
    categoryId: mongoose.Types.ObjectId | null;
    total: number;
    categoryLabel: string;
  }[]
> {
  if (scope?.courseIds !== undefined && scope.courseIds.length === 0) {
    return [];
  }
  const courseIds = scope?.courseIds;
  const result = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",
        ...NGN_MATCH,
        ...courseFilter(courseIds),
      },
    },
    {
      $lookup: {
        from: "courses",
        localField: "course",
        foreignField: "_id",
        as: "courseDoc",
      },
    },
    { $unwind: "$courseDoc" },
    { $group: { _id: "$courseDoc.category", total: { $sum: "$amount" } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "cat",
      },
    },
    { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
    { $sort: { total: -1 } },
    {
      $project: {
        categoryId: "$_id",
        total: 1,
        categoryLabel: { $ifNull: ["$cat.label", "Uncategorized"] },
      },
    },
  ]).exec();
  return result as any;
}

export type ChartInterval = "daily" | "monthly" | "yearly";

export type DashboardChartMetric =
  | "signups"
  | "revenue"
  | "course_sales"
  | "course_completions"
  | "active_students"
  | "abandoned_checkout";

/** Build bucket keys (UTC) aligned with Mongo $dateToString formats. */
export function generateBucketKeys(
  start: Date,
  end: Date,
  interval: ChartInterval,
): string[] {
  const keys: string[] = [];
  if (interval === "daily") {
    let cur = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
    );
    const endDay = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
    );
    while (cur <= endDay) {
      keys.push(cur.toISOString().slice(0, 10));
      cur = new Date(cur.getTime() + 86400000);
    }
  } else if (interval === "monthly") {
    let cur = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
    );
    const endM = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (cur <= endM) {
      keys.push(
        `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`,
      );
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
    }
  } else {
    let y = start.getUTCFullYear();
    const endY = end.getUTCFullYear();
    while (y <= endY) {
      keys.push(String(y));
      y++;
    }
  }
  return keys;
}

function dateStringFormat(interval: ChartInterval): string {
  if (interval === "daily") return "%Y-%m-%d";
  if (interval === "monthly") return "%Y-%m";
  return "%Y";
}

/** All new user accounts (platform-wide). */
async function aggregatePlatformUserSignups(
  start: Date,
  end: Date,
  interval: ChartInterval,
): Promise<Map<string, number>> {
  const fmt = dateStringFormat(interval);
  const result = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: fmt,
            date: "$createdAt",
            timezone: "UTC",
          },
        },
        value: { $sum: 1 },
      },
    },
  ]).exec();
  const map = new Map<string, number>();
  for (const row of result) {
    if (row._id) map.set(row._id, row.value);
  }
  return map;
}

/** New enrollments on instructor's courses (per enrolledAt). */
async function aggregateCourseEnrollmentSignups(
  start: Date,
  end: Date,
  interval: ChartInterval,
  courseIds: mongoose.Types.ObjectId[],
): Promise<Map<string, number>> {
  if (courseIds.length === 0) return new Map();
  const fmt = dateStringFormat(interval);
  const result = await Enrollment.aggregate([
    {
      $match: {
        course: { $in: courseIds },
        enrolledAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: fmt,
            date: "$enrolledAt",
            timezone: "UTC",
          },
        },
        value: { $sum: 1 },
      },
    },
  ]).exec();
  const map = new Map<string, number>();
  for (const row of result) {
    if (row._id) map.set(row._id, row.value);
  }
  return map;
}

async function aggregateRevenue(
  start: Date,
  end: Date,
  interval: ChartInterval,
  courseIds: mongoose.Types.ObjectId[] | undefined,
): Promise<Map<string, number>> {
  const fmt = dateStringFormat(interval);
  const result = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",
        ...NGN_MATCH,
        paidAt: { $gte: start, $lte: end },
        ...courseFilter(courseIds),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: fmt,
            date: "$paidAt",
            timezone: "UTC",
          },
        },
        value: { $sum: "$amount" },
      },
    },
  ]).exec();
  const map = new Map<string, number>();
  for (const row of result) {
    if (row._id) map.set(row._id, Math.round(row.value * 100) / 100);
  }
  return map;
}

async function aggregateCourseSales(
  start: Date,
  end: Date,
  interval: ChartInterval,
  courseIds: mongoose.Types.ObjectId[] | undefined,
): Promise<Map<string, number>> {
  const fmt = dateStringFormat(interval);
  const result = await Payment.aggregate([
    {
      $match: {
        status: "succeeded",
        paidAt: { $gte: start, $lte: end },
        ...courseFilter(courseIds),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: fmt,
            date: "$paidAt",
            timezone: "UTC",
          },
        },
        value: { $sum: 1 },
      },
    },
  ]).exec();
  const map = new Map<string, number>();
  for (const row of result) {
    if (row._id) map.set(row._id, row.value);
  }
  return map;
}

async function aggregateCompletions(
  start: Date,
  end: Date,
  interval: ChartInterval,
  courseIds: mongoose.Types.ObjectId[] | undefined,
): Promise<Map<string, number>> {
  const fmt = dateStringFormat(interval);
  const result = await Enrollment.aggregate([
    {
      $match: {
        status: "completed",
        completedAt: { $gte: start, $lte: end },
        ...courseFilter(courseIds),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: fmt,
            date: "$completedAt",
            timezone: "UTC",
          },
        },
        value: { $sum: 1 },
      },
    },
  ]).exec();
  const map = new Map<string, number>();
  for (const row of result) {
    if (row._id) map.set(row._id, row.value);
  }
  return map;
}

/** Distinct students with any course activity in the bucket (lastAccessedAt). */
async function aggregateActiveStudents(
  start: Date,
  end: Date,
  interval: ChartInterval,
  courseIds: mongoose.Types.ObjectId[] | undefined,
): Promise<Map<string, number>> {
  const fmt = dateStringFormat(interval);
  const result = await Enrollment.aggregate([
    {
      $match: {
        lastAccessedAt: { $gte: start, $lte: end },
        ...courseFilter(courseIds),
      },
    },
    {
      $group: {
        _id: {
          bucket: {
            $dateToString: {
              format: fmt,
              date: "$lastAccessedAt",
              timezone: "UTC",
            },
          },
          student: "$student",
        },
      },
    },
    {
      $group: {
        _id: "$_id.bucket",
        value: { $sum: 1 },
      },
    },
  ]).exec();
  const map = new Map<string, number>();
  for (const row of result) {
    if (row._id) map.set(row._id, row.value);
  }
  return map;
}

async function aggregateAbandonedCheckout(
  start: Date,
  end: Date,
  interval: ChartInterval,
  courseIds: mongoose.Types.ObjectId[] | undefined,
): Promise<Map<string, number>> {
  const fmt = dateStringFormat(interval);
  const result = await AbandonedCheckout.aggregate([
    {
      $match: {
        abandonedAt: { $gte: start, $lte: end },
        ...courseFilter(courseIds),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: fmt,
            date: "$abandonedAt",
            timezone: "UTC",
          },
        },
        value: { $sum: 1 },
      },
    },
  ]).exec();
  const map = new Map<string, number>();
  for (const row of result) {
    if (row._id) map.set(row._id, row.value);
  }
  return map;
}

export async function getDashboardChartSeries(
  metric: DashboardChartMetric,
  start: Date,
  end: Date,
  interval: ChartInterval,
  scope: MetricScope = undefined,
): Promise<{ bucket: string; value: number }[]> {
  const keys = generateBucketKeys(start, end, interval);
  const courseIds = scope?.courseIds;
  let agg: Map<string, number>;
  switch (metric) {
    case "signups":
      if (courseIds !== undefined) {
        agg = await aggregateCourseEnrollmentSignups(
          start,
          end,
          interval,
          courseIds,
        );
      } else {
        agg = await aggregatePlatformUserSignups(start, end, interval);
      }
      break;
    case "revenue":
      agg = await aggregateRevenue(start, end, interval, courseIds);
      break;
    case "course_sales":
      agg = await aggregateCourseSales(start, end, interval, courseIds);
      break;
    case "course_completions":
      agg = await aggregateCompletions(start, end, interval, courseIds);
      break;
    case "active_students":
      agg = await aggregateActiveStudents(start, end, interval, courseIds);
      break;
    case "abandoned_checkout":
      agg = await aggregateAbandonedCheckout(start, end, interval, courseIds);
      break;
    default:
      agg = new Map();
  }
  return keys.map((bucket) => ({
    bucket,
    value: agg.get(bucket) ?? 0,
  }));
}

export type TopCoursesSort =
  | "most_enrolled"
  | "highest_rated"
  | "highest_revenue";

export type TopCourseRow = {
  rank: number;
  id: string;
  title: string;
  slug: string;
  categoryLabel: string | null;
  thumbnailUrl: string | null;
  enrollmentCount: number;
  averageRating: number;
  totalRatings: number;
  revenueNgn?: number;
};

function thumbnailUrlFromCourse(coverImage: unknown): string | null {
  if (coverImage == null) return null;
  if (typeof coverImage === "string") return coverImage;
  if (typeof coverImage === "object" && "fileUrl" in coverImage) {
    const url = (coverImage as { fileUrl?: string }).fileUrl;
    return url ?? null;
  }
  return null;
}

export async function findTopCoursesForDashboard(
  scope: MetricScope,
  sort: TopCoursesSort,
  limit: number,
): Promise<TopCourseRow[]> {
  if (scope?.courseIds !== undefined && scope.courseIds.length === 0) {
    return [];
  }

  const baseFilter: Record<string, unknown> = { status: "published" };
  if (scope?.courseIds !== undefined) {
    baseFilter._id = { $in: scope.courseIds };
  }

  if (sort === "highest_revenue") {
    const matchPayment: Record<string, unknown> = {
      status: "succeeded",
      ...NGN_MATCH,
    };
    if (scope?.courseIds !== undefined) {
      matchPayment.course = { $in: scope.courseIds };
    }

    const rows = await Payment.aggregate([
      { $match: matchPayment },
      { $group: { _id: "$course", revenueNgn: { $sum: "$amount" } } },
      { $sort: { revenueNgn: -1 } },
      { $limit: Math.min(limit * 8, 100) },
    ]).exec();

    if (rows.length === 0) return [];

    const courseIds = rows.map((r) => r._id);
    const courses = await Course.find({
      _id: { $in: courseIds },
      status: "published",
    })
      .populate("category", "label")
      .lean()
      .exec();

    const byId = new Map(courses.map((c) => [c._id.toString(), c] as const));

    const out: TopCourseRow[] = [];
    for (const row of rows) {
      if (out.length >= limit) break;
      const c = byId.get(String(row._id));
      if (!c) continue;
      const cat = c.category as { label?: string } | null | undefined;
      out.push({
        rank: out.length + 1,
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        categoryLabel: cat?.label ?? null,
        thumbnailUrl: thumbnailUrlFromCourse(c.coverImage),
        enrollmentCount: c.enrollmentCount ?? 0,
        averageRating: c.averageRating ?? 0,
        totalRatings: c.totalRatings ?? 0,
        revenueNgn: Math.round((row.revenueNgn as number) * 100) / 100,
      });
    }
    return out;
  }

  const courses =
    sort === "most_enrolled"
      ? await Course.find(baseFilter)
          .sort({ enrollmentCount: -1, createdAt: -1 })
          .limit(limit)
          .populate("category", "label")
          .lean()
          .exec()
      : await Course.find(baseFilter)
          .sort({ averageRating: -1, totalRatings: -1, enrollmentCount: -1 })
          .limit(limit)
          .populate("category", "label")
          .lean()
          .exec();

  return courses.map((c, i) => {
    const cat = c.category as { label?: string } | null | undefined;
    return {
      rank: i + 1,
      id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      categoryLabel: cat?.label ?? null,
      thumbnailUrl: thumbnailUrlFromCourse(c.coverImage),
      enrollmentCount: c.enrollmentCount ?? 0,
      averageRating: c.averageRating ?? 0,
      totalRatings: c.totalRatings ?? 0,
    };
  });
}
