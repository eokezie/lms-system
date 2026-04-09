import { Posts } from "./posts.model";
import {
  CreatePostDto,
  PostPaginationOptions,
  UpdatePostDto,
} from "./posts.types";

export function createPost(dto: CreatePostDto) {
  const { authorId, topicId } = dto;

  return Posts.create({
    ...dto,
    topic: topicId,
    author: authorId,
  });
}

export function updatePost(id: string, dto: UpdatePostDto) {
  return Posts.findByIdAndUpdate(
    id,
    { $set: dto },
    { new: true, runValidators: true },
  ).exec();
}

export async function findCountOfPostsPerTopic() {
  return await Posts.aggregate([
    { $group: { _id: "$topic", count: { $sum: 1 } } },
  ]);
}

export function findPostsPaginated(options: PostPaginationOptions) {
  const {
    page = 1,
    limit = 10,
    topicStatus = "all",
    search,
    sort = "desc",
  } = options;
  const skip = (page - 1) * limit;

  const matchStage: Record<string, unknown> = {};

  if (search) matchStage.$text = { $search: search };

  const pipeline: any[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: "topics",
        localField: "topic",
        foreignField: "_id",
        as: "topic",
      },
    },
    { $unwind: "$topic" },
    ...(topicStatus && topicStatus !== "all"
      ? [
          {
            $match: {
              "topic.isActive": topicStatus === "active",
            },
          },
        ]
      : []),
    // {
    //   $sort: {
    //     createdAt: sort === "desc" ? -1 : 1,
    //   },
    // },
    // { $skip: skip },
    // { $limit: limit },
    {
      $facet: {
        data: [
          {
            $sort: {
              createdAt: sort === "most_recent" ? -1 : 1,
            },
          },
          { $skip: skip },
          { $limit: limit },
        ],

        total: [
          {
            $count: "count",
          },
        ],
      },
    },
  ];

  return Posts.aggregate(pipeline);
}
