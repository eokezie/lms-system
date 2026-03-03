import { logger } from "@/utils/logger";
import { CreateCourseDto } from "./course.types";
import { createCourse, findCourseBySlug } from "./course.repository";
import { ApiError } from "@/utils/apiError";
import mongoose from "mongoose";
import { createPreLesson } from "../lessons/lesson.repository";

export async function createCourseService(dto: CreateCourseDto) {
	const session = await mongoose.startSession();

	const slug = dto.title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	try {
		session.startTransaction();

		const courseExists = await findCourseBySlug(slug, session);
		if (courseExists)
			throw ApiError.conflict("A course with this title already exists");

		const [course] = await createCourse(
			dto.instructorId,
			dto.categoryId,
			dto,
			session,
		);

		const [lesson] = await createPreLesson(course._id, session);

		const moduleObj = {
			sectionTitle: "Module 1",
			lessons: [lesson._id],
		};

		course.courseModules.push(moduleObj);

		await course.save({ session });

		await session.commitTransaction();
		console.log("Transaction committed ✅");

		logger.info(
			{ courseId: course._id, title: course.title },
			"Course created!",
		);

		logger.info({ lessonId: lesson._id }, "Lesson created!");

		return course;
	} catch (error: any) {
		// Rollback if anything fails
		await session.abortTransaction();
		console.error("Transaction aborted ❌", error.message);
		throw ApiError.internal(error.message);
	} finally {
		session.endSession();
	}
}
