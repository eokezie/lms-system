import { ClientSession, Types } from "mongoose";
import { ILesson, Lesson } from "./lesson.model";

export function createPreLesson(
	courseId: Types.ObjectId,
	session: ClientSession,
) {
	return Lesson.create({ course: courseId }, { session });
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
