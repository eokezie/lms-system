import mongoose from "mongoose";
import {
  ForumPost,
  ForumReply,
  ForumTopic,
  ForumNote,
  ForumFlag,
  ForumGuideline,
  ForumModerationLog,
  ForumUserAccess,
  IForumPost,
  IForumReply,
  IForumTopic,
  IForumNote,
  IForumFlag,
  IForumGuideline,
  IForumModerationLog,
  IForumUserAccess,
  ModerationActionType,
  ForumNoteTargetType,
} from "./forum.models";

export function findAllTopics(): Promise<IForumTopic[]> {
  return ForumTopic.find().sort({ name: 1 }).lean().exec() as any;
}

export function findTopicById(id: string): Promise<IForumTopic | null> {
  return ForumTopic.findById(id).exec();
}

export function createTopic(name: string): Promise<IForumTopic> {
  return ForumTopic.create({ name });
}

export function updateTopicName(
  id: string,
  name: string,
): Promise<IForumTopic | null> {
  return ForumTopic.findByIdAndUpdate(id, { name }, { new: true }).exec();
}

export function deleteTopic(id: string): Promise<IForumTopic | null> {
  return ForumTopic.findByIdAndDelete(id).exec();
}

export function incrementTopicPostCount(
  topicId: string,
  amount = 1,
): Promise<IForumTopic | null> {
  return ForumTopic.findByIdAndUpdate(topicId, {
    $inc: { postCount: amount },
  }).exec();
}

export type PostListSort = "recent" | "popular" | "comments";
export type PostStatusFilter = "flagged" | "unflagged";

export interface PostListOptions {
  page: number;
  limit: number;
  sort?: PostListSort;
  topic?: string;
  search?: string;
  authorId?: string;
  status?: PostStatusFilter;
}

export async function findPostsPaginated(
  opts: PostListOptions,
): Promise<{
  posts: IForumPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    page,
    limit,
    sort = "recent",
    topic,
    search,
    authorId,
    status,
  } = opts;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { isDeleted: false };
  if (topic) filter.topic = new mongoose.Types.ObjectId(topic);
  if (authorId) filter.author = new mongoose.Types.ObjectId(authorId);
  if (status === "flagged") filter.isFlagged = true;
  if (status === "unflagged") filter.isFlagged = false;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === "popular") sortOption = { viewCount: -1, createdAt: -1 };
  if (sort === "comments") sortOption = { replyCount: -1, createdAt: -1 };

  const [posts, total] = await Promise.all([
    ForumPost.find(filter)
      .populate("author", "firstName lastName avatar role")
      .populate("topic", "name")
      .skip(skip)
      .limit(limit)
      .sort(sortOption)
      .lean()
      .exec(),
    ForumPost.countDocuments(filter),
  ]);

  return {
    posts: posts as unknown as IForumPost[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function findPostById(id: string): Promise<IForumPost | null> {
  return ForumPost.findOne({ _id: id, isDeleted: false })
    .populate("author", "firstName lastName avatar role")
    .populate("topic", "name")
    .lean()
    .exec() as any;
}

export function createPost(data: {
  topic: string;
  author: string;
  title: string;
  content: string;
}): Promise<IForumPost> {
  return ForumPost.create({
    topic: data.topic,
    author: data.author,
    title: data.title,
    content: data.content,
  });
}

export function updatePostContent(
  id: string,
  content: string,
): Promise<IForumPost | null> {
  return ForumPost.findByIdAndUpdate(id, { content }, { new: true }).exec();
}

export function softDeletePost(id: string): Promise<IForumPost | null> {
  return ForumPost.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  ).exec();
}

export function incrementPostViewCount(
  id: string,
): Promise<IForumPost | null> {
  return ForumPost.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec();
}

export function incrementPostReplyCount(
  id: string,
  amount = 1,
): Promise<IForumPost | null> {
  return ForumPost.findByIdAndUpdate(id, {
    $inc: { replyCount: amount },
  }).exec();
}

export function markPostFlagged(
  id: string,
  flagged: boolean,
): Promise<IForumPost | null> {
  return ForumPost.findByIdAndUpdate(id, { isFlagged: flagged }).exec();
}

export async function findRepliesByPost(
  postId: string,
  page: number,
  limit: number,
): Promise<{
  replies: IForumReply[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;
  const filter = {
    post: new mongoose.Types.ObjectId(postId),
    isDeleted: false,
  };

  const [replies, total] = await Promise.all([
    ForumReply.find(filter)
      .populate("author", "firstName lastName avatar role")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: 1 })
      .lean()
      .exec(),
    ForumReply.countDocuments(filter),
  ]);

  return {
    replies: replies as unknown as IForumReply[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function findReplyById(id: string): Promise<IForumReply | null> {
  return ForumReply.findOne({ _id: id, isDeleted: false }).exec();
}

export function createReply(data: {
  post: string;
  author: string;
  content: string;
  attachments?: string[];
}): Promise<IForumReply> {
  return ForumReply.create({
    post: data.post,
    author: data.author,
    content: data.content,
    attachments: data.attachments ?? [],
  });
}

export function updateReplyContent(
  id: string,
  content: string,
): Promise<IForumReply | null> {
  return ForumReply.findByIdAndUpdate(id, { content }, { new: true }).exec();
}

export function softDeleteReply(id: string): Promise<IForumReply | null> {
  return ForumReply.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true },
  ).exec();
}

export function markReplyFlagged(
  id: string,
  flagged: boolean,
): Promise<IForumReply | null> {
  return ForumReply.findByIdAndUpdate(id, { isFlagged: flagged }).exec();
}

export function findNotes(
  targetType: ForumNoteTargetType,
  targetId: string,
): Promise<IForumNote[]> {
  return ForumNote.find({
    targetType,
    targetId: new mongoose.Types.ObjectId(targetId),
  })
    .populate("addedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .lean()
    .exec() as any;
}

export function createNote(data: {
  targetType: ForumNoteTargetType;
  targetId: string;
  content: string;
  addedBy: string;
}): Promise<IForumNote> {
  return ForumNote.create(data);
}

export function deleteNote(id: string): Promise<IForumNote | null> {
  return ForumNote.findByIdAndDelete(id).exec();
}

export function findNoteById(id: string): Promise<IForumNote | null> {
  return ForumNote.findById(id).exec();
}

export function findFlagByReporterAndTarget(
  reporter: string,
  targetType: ForumNoteTargetType,
  targetId: string,
): Promise<IForumFlag | null> {
  return ForumFlag.findOne({
    reporter: new mongoose.Types.ObjectId(reporter),
    targetType,
    targetId: new mongoose.Types.ObjectId(targetId),
  }).exec();
}

export function createFlag(data: {
  targetType: ForumNoteTargetType;
  targetId: string;
  reporter: string;
  reason: string;
  explanation: string;
}): Promise<IForumFlag> {
  return ForumFlag.create(data);
}

export function findFlagsByTarget(
  targetType: ForumNoteTargetType,
  targetId: string,
): Promise<IForumFlag[]> {
  return ForumFlag.find({
    targetType,
    targetId: new mongoose.Types.ObjectId(targetId),
  })
    .populate("reporter", "firstName lastName avatar")
    .sort({ createdAt: -1 })
    .lean()
    .exec() as any;
}

export function findFlagById(id: string): Promise<IForumFlag | null> {
  return ForumFlag.findById(id).exec();
}

export function resolveFlag(
  id: string,
  data: {
    status: "resolved" | "dismissed";
    actionTaken?: string;
    resolvedBy: string;
  },
): Promise<IForumFlag | null> {
  return ForumFlag.findByIdAndUpdate(
    id,
    {
      status: data.status,
      actionTaken: data.actionTaken,
      resolvedBy: data.resolvedBy,
      resolvedAt: new Date(),
    },
    { new: true },
  ).exec();
}

export function countPendingFlagsByTarget(
  targetType: ForumNoteTargetType,
  targetId: string,
): Promise<number> {
  return ForumFlag.countDocuments({
    targetType,
    targetId: new mongoose.Types.ObjectId(targetId),
    status: "pending",
  }).exec();
}

export function findAllGuidelines(): Promise<IForumGuideline[]> {
  return ForumGuideline.find().sort({ createdAt: 1 }).lean().exec() as any;
}

export function createGuideline(data: {
  icon: string;
  title: string;
  description: string;
}): Promise<IForumGuideline> {
  return ForumGuideline.create(data);
}

export function updateGuideline(
  id: string,
  data: Partial<{ icon: string; title: string; description: string }>,
): Promise<IForumGuideline | null> {
  return ForumGuideline.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true },
  ).exec();
}

export function deleteGuideline(id: string): Promise<IForumGuideline | null> {
  return ForumGuideline.findByIdAndDelete(id).exec();
}

export function findGuidelineById(
  id: string,
): Promise<IForumGuideline | null> {
  return ForumGuideline.findById(id).exec();
}

export async function findTopContributors(
  limit: number,
  daysWindow = 30,
): Promise<
  Array<{
    _id: mongoose.Types.ObjectId;
    commentCount: number;
    user: {
      _id: mongoose.Types.ObjectId;
      firstName: string;
      lastName: string;
      avatar?: string;
      role: string;
    };
  }>
> {
  const since = new Date();
  since.setDate(since.getDate() - daysWindow);

  return ForumReply.aggregate([
    { $match: { isDeleted: false, createdAt: { $gte: since } } },
    { $group: { _id: "$author", commentCount: { $sum: 1 } } },
    { $sort: { commentCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
        pipeline: [
          { $project: { firstName: 1, lastName: 1, avatar: 1, role: 1 } },
        ],
      },
    },
    { $unwind: "$user" },
  ]).exec() as any;
}

export function createModerationLog(data: {
  actor: string;
  actionType: ModerationActionType;
  targetType?: string;
  targetId?: string;
  details?: string;
}): Promise<IForumModerationLog> {
  return ForumModerationLog.create(data);
}

export interface ModerationLogOptions {
  page: number;
  limit: number;
  actorId?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function findModerationLogsPaginated(
  opts: ModerationLogOptions,
): Promise<{
  logs: IForumModerationLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { page, limit, actorId, actionType, dateFrom, dateTo } = opts;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (actorId) filter.actor = new mongoose.Types.ObjectId(actorId);
  if (actionType) filter.actionType = actionType;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) (filter.createdAt as any).$gte = new Date(dateFrom);
    if (dateTo) (filter.createdAt as any).$lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    ForumModerationLog.find(filter)
      .populate("actor", "firstName lastName avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean()
      .exec(),
    ForumModerationLog.countDocuments(filter),
  ]);

  return {
    logs: logs as unknown as IForumModerationLog[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findForumUserAccessPaginated(
  page: number,
  limit: number,
): Promise<{
  users: IForumUserAccess[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    ForumUserAccess.find()
      .populate("user", "firstName lastName avatar email role")
      .populate("updatedBy", "firstName lastName")
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .lean()
      .exec(),
    ForumUserAccess.countDocuments(),
  ]);
  return {
    users: users as unknown as IForumUserAccess[],
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function findForumUserAccess(
  userId: string,
): Promise<IForumUserAccess | null> {
  return ForumUserAccess.findOne({
    user: new mongoose.Types.ObjectId(userId),
  }).exec();
}

export function upsertForumUserAccess(
  userId: string,
  data: {
    status: string;
    reason?: string;
    duration?: string;
    updatedBy: string;
  },
): Promise<IForumUserAccess> {
  return ForumUserAccess.findOneAndUpdate(
    { user: new mongoose.Types.ObjectId(userId) },
    {
      $set: {
        status: data.status,
        reason: data.reason,
        duration: data.duration,
        updatedBy: data.updatedBy,
      },
    },
    { new: true, upsert: true },
  ).exec() as any;
}
