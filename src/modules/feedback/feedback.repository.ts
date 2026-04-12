import mongoose from "mongoose";

import { Feedback, IFeedback } from "./feedback.model";
import type { ListFeedbackQuery } from "./feedback.validation";

export async function createFeedback(input: {
  userId: string;
  title: string;
  body: string;
}): Promise<IFeedback> {
  return Feedback.create({
    user: new mongoose.Types.ObjectId(input.userId),
    title: input.title,
    body: input.body,
    status: "open",
  });
}

export async function findFeedbacksPaginated(query: ListFeedbackQuery) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }
  if (query.search?.trim()) {
    const q = query.search.trim();
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { body: { $regex: q, $options: "i" } },
    ];
  }

  const sort =
    query.sort === "oldest" ? { createdAt: 1 as const } : { createdAt: -1 as const };

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate("user", "firstName lastName email avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Feedback.countDocuments(filter),
  ]);

  return {
    items: items as unknown as IFeedback[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findFeedbackById(
  id: string,
): Promise<IFeedback | null> {
  return Feedback.findById(id)
    .populate("user", "firstName lastName email avatar")
    .lean()
    .exec() as Promise<IFeedback | null>;
}

export async function addAdminNote(
  id: string,
  note: string,
): Promise<IFeedback | null> {
  return Feedback.findByIdAndUpdate(
    id,
    { $set: { adminNote: note, status: "reviewed" } },
    { new: true },
  )
    .populate("user", "firstName lastName email avatar")
    .lean()
    .exec() as Promise<IFeedback | null>;
}

export async function deleteFeedbackById(
  id: string,
): Promise<boolean> {
  const result = await Feedback.deleteOne({
    _id: new mongoose.Types.ObjectId(id),
  }).exec();
  return result.deletedCount > 0;
}
