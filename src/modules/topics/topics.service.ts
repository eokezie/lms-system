import { CreateTopicsDto, UpdateTopicsDto } from "./topics.types";
import {
  createTopics,
  findAllTopics,
  findTopicById,
  findTopicByIdAndDelete,
  findTopicBySlug,
} from "./topics.repository";
import { logger } from "@/utils/logger";
import { findCountOfPostsPerTopic } from "../posts/posts.repository";
import { ApiError } from "@/utils/apiError";

export async function createTopicsService(dto: CreateTopicsDto) {
  const slug = dto.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const topicExists = await findTopicBySlug(slug);
  if (topicExists)
    throw ApiError.conflict("A Topic with this label already exists");

  dto.slug = slug;
  const topics = await createTopics(dto);

  logger.info({ topicsId: topics._id }, "Topics created");
  return topics;
}

export async function getTopicsAndCountPerPost(): Promise<any> {
  const [posts, postsCount] = await Promise.all([
    findAllTopics(),
    findCountOfPostsPerTopic(),
  ]);

  const countMap = new Map(postsCount.map((c) => [c._id.toString(), c.count]));

  const result = posts.map((topic) => ({
    ...topic,
    postCount: countMap.get(topic._id.toString()) ?? 0,
  }));
  return result;
}

export async function updateTopicsService(
  topicId: string,
  dto: UpdateTopicsDto,
) {
  const topic = await findTopicById(topicId);
  if (!topic) throw ApiError.notFound("No Topic matched the provided ID");

  topic.label = dto.label;
  await topic.save();
  return topic;
}

export async function deleteTopicsService(topicId: string) {
  const topic = await findTopicById(topicId);
  if (!topic) throw ApiError.notFound("No Topic matched the provided ID");

  const deletedTopic = await findTopicByIdAndDelete(topicId);
  if (!deletedTopic)
    throw ApiError.notFound("No Topic matched the provided ID");
}
