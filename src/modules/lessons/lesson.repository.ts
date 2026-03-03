import { ClientSession, Types } from "mongoose";
import { Lesson } from "./lesson.model";

export function createPreLesson(
	courseId: Types.ObjectId,
	session: ClientSession,
) {
	return Lesson.create({ course: courseId }, { session });
}
