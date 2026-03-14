import mongoose, { ClientSession } from "mongoose";
import { ILesson, Lesson } from "./lesson.model";
import { CreateLessonDto } from "./lesson.type";

export interface ILessonListItem {
  _id: mongoose.Types.ObjectId;
  title: string;
  estimatedCompletionTime: number;
  videoDuration?: number;
  type: string;
  experiencePoints: number;
}

export function findLessonsByIdsLean(
  ids: mongoose.Types.ObjectId[],
): Promise<ILessonListItem[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return Lesson.find({ _id: { $in: ids } })
    .select(
      "title estimatedCompletionTime videoDuration type experiencePoints _id",
    )
    .lean()
    .exec() as Promise<ILessonListItem[]>;
}

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
