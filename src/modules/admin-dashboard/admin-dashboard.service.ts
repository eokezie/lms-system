import { z } from "zod";
import { ApiError } from "@/utils/apiError";
import type { UserRole } from "@/modules/users/user.model";
import {
  countStudents,
  countActiveStudents,
  countCourses,
  countNonDroppedEnrollments,
  getAverageCompletionPercent,
  getTotalRevenueNgn,
  sumRevenueNgnBetween,
  getRolling30DayBounds,
  getDashboardChartSeries,
  parseInclusiveUtcRange,
  getRevenueByCategoryNgn,
  fetchCourseIdsForInstructor,
  findTopCoursesForDashboard,
  type DashboardChartMetric,
  type MetricScope,
} from "./admin-dashboard.repository";
import {
  dashboardChartQuerySchema,
  topCoursesQuerySchema,
} from "@/modules/admin-dashboard/admin-dashboard.validation";

const MAX_CHART_RANGE_MS = 2 * 366 * 24 * 60 * 60 * 1000;

export function formatNgnShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}k`;
  return `₦${Number(amount).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/** Labels aligned with dashboard chart dropdown (for API docs / UI). */
export const DASHBOARD_CHART_METRICS: {
  id: DashboardChartMetric;
  label: string;
}[] = [
  { id: "signups", label: "New signups" },
  { id: "revenue", label: "Revenue" },
  { id: "course_sales", label: "Course sales" },
  { id: "course_completions", label: "Course completions" },
  { id: "active_students", label: "Active students" },
  { id: "abandoned_checkout", label: "Abandoned checkout" },
];

async function resolveMetricScope(
  role: UserRole,
  userId: string,
): Promise<MetricScope> {
  if (role === "instructor") {
    const courseIds = await fetchCourseIdsForInstructor(userId);
    return { courseIds };
  }
  return undefined;
}

export async function getAdminDashboardSummaryService(
  role: UserRole,
  userId: string,
) {
  const scope = await resolveMetricScope(role, userId);

  const [
    totalStudents,
    activeStudents,
    totalCourses,
    totalEnrollments,
    averageCompletionPercent,
    totalRevenueNgn,
    revenueBreakdown,
  ] = await Promise.all([
    countStudents(scope),
    countActiveStudents(scope),
    countCourses(scope),
    countNonDroppedEnrollments(scope),
    getAverageCompletionPercent(scope),
    getTotalRevenueNgn(scope),
    getRevenueByCategoryNgn(scope),
  ]);

  const { last30Start, last30End, prev30Start, prev30End } =
    getRolling30DayBounds();
  const [revenueLast30d, revenuePrev30d] = await Promise.all([
    sumRevenueNgnBetween(last30Start, last30End, scope),
    sumRevenueNgnBetween(prev30Start, prev30End, scope),
  ]);

  let revenueGrowthPercent = 0;
  if (revenuePrev30d > 0) {
    revenueGrowthPercent = Math.round(
      ((revenueLast30d - revenuePrev30d) / revenuePrev30d) * 100,
    );
  } else if (revenueLast30d > 0) {
    revenueGrowthPercent = 100;
  }

  const availableMetrics =
    role === "instructor"
      ? DASHBOARD_CHART_METRICS.map((m) =>
          m.id === "signups" ? { ...m, label: "New course enrollments" } : m,
        )
      : DASHBOARD_CHART_METRICS;

  return {
    scope:
      role === "instructor"
        ? {
            type: "instructor" as const,
            courseCount: scope?.courseIds.length ?? 0,
          }
        : { type: "system" as const },
    students: {
      total: totalStudents,
      active: activeStudents,
    },
    courses: {
      total: totalCourses,
      totalEnrollments,
    },
    completion: {
      averageCompletionPercent,
    },
    revenue: {
      currency: "NGN" as const,
      totalAmount: Math.round(totalRevenueNgn * 100) / 100,
      formattedShort: formatNgnShort(totalRevenueNgn),
      /** Rolling: last 30 calendar days vs previous 30 days (UTC). */
      growthPercent: revenueGrowthPercent,
      growthComparison: "rolling_30d_vs_previous_30d" as const,
      revenueLast30d: Math.round(revenueLast30d * 100) / 100,
      revenuePrevious30d: Math.round(revenuePrev30d * 100) / 100,
      breakdownByCategory: revenueBreakdown.map((row) => ({
        categoryId: row.categoryId?.toString() ?? null,
        categoryLabel: row.categoryLabel,
        total: Math.round(row.total * 100) / 100,
      })),
    },
    chart: {
      availableMetrics,
      /** Instructor `signups` series = enrollments on their courses, not platform registrations. */
      notes:
        role === "instructor"
          ? [
              'Metric "signups" uses new enrollments (enrolledAt) on your courses only.',
            ]
          : undefined,
    },
  };
}

export async function getAdminDashboardChartService(
  query: z.infer<typeof dashboardChartQuerySchema>,
  role: UserRole,
  userId: string,
) {
  let start: Date;
  let end: Date;
  try {
    const r = parseInclusiveUtcRange(query.startDate, query.endDate);
    start = r.start;
    end = r.end;
  } catch {
    throw ApiError.badRequest("Invalid startDate or endDate");
  }
  if (start.getTime() > end.getTime()) {
    throw ApiError.badRequest("startDate must be on or before endDate");
  }
  if (end.getTime() - start.getTime() > MAX_CHART_RANGE_MS) {
    throw ApiError.badRequest("Date range is too large (maximum ~2 years)");
  }

  const scope = await resolveMetricScope(role, userId);

  const series = await getDashboardChartSeries(
    query.metric,
    start,
    end,
    query.interval,
    scope,
  );

  return {
    scope:
      role === "instructor"
        ? {
            type: "instructor" as const,
            courseCount: scope?.courseIds.length ?? 0,
          }
        : { type: "system" as const },
    metric: query.metric,
    interval: query.interval,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    series,
  };
}

export async function getAdminDashboardTopCoursesService(
  role: UserRole,
  userId: string,
  query: z.infer<typeof topCoursesQuerySchema>,
) {
  const scope = await resolveMetricScope(role, userId);
  const courses = await findTopCoursesForDashboard(
    scope,
    query.sort,
    query.limit,
  );

  return {
    scope:
      role === "instructor"
        ? {
            type: "instructor" as const,
            courseCount: scope?.courseIds.length ?? 0,
          }
        : { type: "system" as const },
    sort: query.sort,
    limit: query.limit,
    courses,
  };
}
