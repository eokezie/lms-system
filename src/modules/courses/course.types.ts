import { CourseStatus, ICtaSection } from "./course.model";

export interface CreateCourseDto {
	instructorId: string;
	categoryId: string;
	title: string;
	description: string;
	category: string;
	summary: string;
	skillLevel: string;
	hasDownloadableResources?: boolean;
	hasQuizzes?: boolean;
	hasOnDemandVideo?: boolean;
	hasInstructorQA?: boolean;
	hasCertificate?: boolean;
	requirements: string[];
	whatToLearn: string[];
	ctaSection: ICtaSection;
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

export interface CoursePaginationOptions {
	page?: number;
	limit?: number;
	category?: string;
	status?: CourseStatus;
	search?: string;
}
