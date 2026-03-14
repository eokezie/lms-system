import mongoose, { ClientSession } from "mongoose";
import { ILesson, Lesson } from "./lesson.model";
import { CreateLessonDto } from "./lesson.type";

/** Fields returned for course content: video gets mux/caption/thumbnail/resources; quiz gets questions. */
export interface ILessonListItem {
  _id: mongoose.Types.ObjectId;
  title: string;
  estimatedCompletionTime: number;
  videoDuration?: number;
  type: string;
  experiencePoints: number;
  mux?: { playbackId?: string; status?: string };
  thumbnailImage?: { fileName?: string; fileType?: string; fileUrl?: string };
  captionFile?: { fileName?: string; fileType?: string; fileUrl?: string };
  resources?: Array<{
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    fileUrl?: string;
  }>;
  questions?: unknown[];
}

const LESSON_SELECT_FOR_COURSE =
  "title estimatedCompletionTime videoDuration type experiencePoints _id mux thumbnailImage captionFile resources questions";

export function findLessonsByIdsLean(
  ids: mongoose.Types.ObjectId[],
): Promise<ILessonListItem[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return Lesson.find({ _id: { $in: ids } })
    .select(LESSON_SELECT_FOR_COURSE)
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
