import { CourseStatus, ICtaSection } from "./course.model";

export interface CreateCourseDto {
	instructorId: string;
	categoryId: string;
	title: string;
	description: string;
	category: string;
	slug?: string;
	summary: string;
	skillLevel: string;
	estimatedCompletionTime: string;
	hasDownloadableResources?: boolean;
	hasQuizzes?: boolean;
	hasOnDemandVideo?: boolean;
	hasInstructorQA?: boolean;
	hasCertificate?: boolean;
	requirements: string[] | string;
	whatToLearn: string[] | string;
	ctaSection: ICtaSection | string;
	tags?: string[];
	price?: number;
	isFree?: boolean;
}

export interface UpdateCourseDto {
	title?: string;
	description?: string;
	coverImage?: string;
	category?: string;
	tags?: string[];
	price?: number;
	isFree?: boolean;
	status?: CourseStatus;
}

export enum PriceFilter {
	free = "free",
	paid = "paid",
}

export enum InstructorTypeFilter {
	external = "external",
	infinix = "infinix",
}

export enum AvgTimeToCompleteRange {
	"0-5" = "0-5",
	"6-15" = "6-15",
	"16-25" = "16-25",
	"26+" = "26+",
}

export interface CoursePaginationOptions {
	page?: number;
	limit?: number;
	category?: string;
	status?: CourseStatus;
	search?: string;
	skillLevel?: string;
	price?: PriceFilter;
	instructorType?: InstructorTypeFilter;
	avgTimeToComplete?: AvgTimeToCompleteRange;
	instructorIds?: string[];
}

export interface ExploreCoursesQuery {
	page?: number;
	limit?: number;
	category?: string;
	search?: string;
	difficulty?: string;
	price?: PriceFilter;
	instructorType?: InstructorTypeFilter;
	avgTimeToComplete?: AvgTimeToCompleteRange;
}

/** Admin/instructor: list draft + published courses with search, filter, sort. */
export interface ManageCoursesQuery {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: "draft" | "published" | "all";
  sort?: "most_recent" | "most_enrolled" | "highest_rated";
}
