import mongoose from "mongoose";
import {
  DiscussionThread,
  DiscussionReply,
  IDiscussionThread,
  IDiscussionReply,
} from "./discussion.model";

export type DiscussionSort = "most_recent" | "oldest";

export async function createDiscussionThread(data: {
  courseId: string;
  lessonId?: string | null;
  authorId: string;
  title: string;
  body: string;
}): Promise<IDiscussionThread | null> {
  const doc = await DiscussionThread.create({
    course: new mongoose.Types.ObjectId(data.courseId),
    lesson: data.lessonId
      ? new mongoose.Types.ObjectId(data.lessonId)
      : undefined,
    author: new mongoose.Types.ObjectId(data.authorId),
    title: data.title,
    body: data.body,
  });
  return DiscussionThread.findById(doc._id)
    .populate("author", "firstName lastName avatar role")
    .populate("lesson", "title")
    .lean()
    .exec() as Promise<IDiscussionThread | null>;
}

export async function findDiscussionThreadById(
  threadId: string,
): Promise<IDiscussionThread | null> {
  return DiscussionThread.findById(threadId).exec();
}

export async function findDiscussionThreadsByCoursePaginated(
  courseId: string,
  options: {
    page: number;
    limit: number;
    lessonId?: string;
    sort: DiscussionSort;
  },
): Promise<{ threads: IDiscussionThread[]; total: number }> {
  const { page, limit, lessonId, sort } = options;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {
    course: new mongoose.Types.ObjectId(courseId),
  };
  if (lessonId) {
    filter.lesson = new mongoose.Types.ObjectId(lessonId);
  }
  const sortOpt: Record<string, 1 | -1> = {
    createdAt: sort === "oldest" ? 1 : -1,
  };
  const [threads, total] = await Promise.all([
    DiscussionThread.find(filter)
      .populate("author", "firstName lastName avatar role")
      .populate("lesson", "title")
      .sort(sortOpt)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    DiscussionThread.countDocuments(filter),
  ]);
  return { threads: threads as unknown as IDiscussionThread[], total };
}

export async function incrementThreadViews(threadId: string): Promise<void> {
  await DiscussionThread.findByIdAndUpdate(threadId, {
    $inc: { viewsCount: 1 },
  }).exec();
}

export async function findRepliesByThreadPaginated(
  threadId: string,
  page: number,
  limit: number,
): Promise<{ replies: IDiscussionReply[]; total: number }> {
  const skip = (page - 1) * limit;
  const filter = { thread: new mongoose.Types.ObjectId(threadId) };
  const [replies, total] = await Promise.all([
    DiscussionReply.find(filter)
      .populate("author", "firstName lastName avatar role")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    DiscussionReply.countDocuments(filter),
  ]);
  return { replies: replies as unknown as IDiscussionReply[], total };
}

export async function createDiscussionReply(data: {
  threadId: string;
  authorId: string;
  body: string;
}): Promise<IDiscussionReply | null> {
  const created = await DiscussionReply.create({
    thread: new mongoose.Types.ObjectId(data.threadId),
    author: new mongoose.Types.ObjectId(data.authorId),
    body: data.body,
  });
  await DiscussionThread.findByIdAndUpdate(data.threadId, {
    $inc: { repliesCount: 1 },
  }).exec();
  return DiscussionReply.findById(created._id)
    .populate("author", "firstName lastName avatar role")
    .exec();
}
