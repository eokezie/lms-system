import mongoose from "mongoose";

import {
  Notification,
  REPLY_TYPES,
  type INotification,
  type NotificationType,
} from "./notification.model";
import type { ListNotificationsQuery } from "./notification.validation";

export interface CreateNotificationInput {
  user: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  actor?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createNotificationDoc(
  input: CreateNotificationInput,
): Promise<INotification> {
  return Notification.create({
    user: new mongoose.Types.ObjectId(input.user),
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
    actor: input.actor ? new mongoose.Types.ObjectId(input.actor) : null,
    metadata: input.metadata,
  });
}

export async function findNotificationsForUser(
  userId: string,
  query: ListNotificationsQuery,
): Promise<{
  items: INotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    user: new mongoose.Types.ObjectId(userId),
  };

  if (query.category === "replies") {
    filter.type = { $in: REPLY_TYPES };
  } else if (query.type) {
    filter.type = query.type;
  }

  if (query.isRead !== undefined) {
    filter.isRead = query.isRead;
  }

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "firstName lastName avatar")
      .lean()
      .exec(),
    Notification.countDocuments(filter),
  ]);

  return {
    items: items as unknown as INotification[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function countUnreadForUser(userId: string): Promise<number> {
  return Notification.countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await Notification.updateOne(
    {
      _id: new mongoose.Types.ObjectId(notificationId),
      user: new mongoose.Types.ObjectId(userId),
    },
    { $set: { isRead: true } },
  ).exec();
  return result.matchedCount > 0;
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  const result = await Notification.updateMany(
    {
      user: new mongoose.Types.ObjectId(userId),
      isRead: false,
    },
    { $set: { isRead: true } },
  ).exec();
  return result.modifiedCount;
}

export async function deleteNotificationById(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await Notification.deleteOne({
    _id: new mongoose.Types.ObjectId(notificationId),
    user: new mongoose.Types.ObjectId(userId),
  }).exec();
  return result.deletedCount > 0;
}
