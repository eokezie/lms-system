import { logger } from "@/utils/logger";
import { CreateCourseDto } from "./course.types";
import { createCourse, findCourseBySlug } from "./course.repository";
import { ApiError } from "@/utils/apiError";

export async function createCourseService(dto: CreateCourseDto) {
	const slug = dto.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	const courseExists = await findCourseBySlug(slug);
	if (courseExists)
		throw ApiError.conflict("A course with this title already exists");

	console.log(dto);
	const course = await createCourse(dto);

	logger.info({ courseId: course._id, title: course.title }, "Course created!");

	return course;
}
