import { ClientSession } from "mongoose";
import { ILesson, Lesson } from "./lesson.model";
import { CreateLessonDto } from "./lesson.type";

export function createLesson(
	courseId: string,
	data: CreateLessonDto,
	session: ClientSession,
) {
	// return Lesson.create([{ ...data, course: courseId }], { session });
	const lesson = new Lesson({ ...data, course: courseId });
	lesson.$locals.session = session;
	return lesson.save({ session }).then((doc) => [doc]);
}

export function updateLessonById(
	lessonId: string,
	data: Partial<ILesson> | Record<string, any>,
): Promise<ILesson | null> {
	return Lesson.findByIdAndUpdate(
		lessonId,
		{ $set: data },
		{ new: true, runValidators: true },
	).exec();
}

export function findLessonById(lessonId: string): Promise<ILesson | null> {
	return Lesson.findById(lessonId).exec();
}
