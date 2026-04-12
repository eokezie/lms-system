import { ApiError } from "@/utils/apiError";
import { findTopicById } from "../topics/topics.repository";
import { CreatePostDto, PostPaginationOptions } from "./posts.types";
import { createPost, findPostsPaginated } from "./posts.repository";
import { findStatsByUserIdAndUpdate } from "../userPostStats/userPostStats.repository";

export async function createPostService(dto: CreatePostDto) {
  const { topicId } = dto;

  const topic = await findTopicById(topicId);
  if (!topic) throw ApiError.notFound("No Topic matched the provided the ID");

  const post = await createPost(dto);

  await findStatsByUserIdAndUpdate(dto.authorId);

  topic.postCount = topic.postCount + 1;
  await topic.save();

  return post;
}

export async function getPaginatedPosts(query: PostPaginationOptions) {
  const page = query.page || 1;
  const limit = query.limit || 10;

  const result = await findPostsPaginated(query);

  const data = result[0]?.data || [];
  const total = result[0]?.total[0]?.count || 0;

  return {
    posts: data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
