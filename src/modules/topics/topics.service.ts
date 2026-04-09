import { CreateTopicsDto, UpdateTopicsDto } from "./topics.types";
import {
  countAllTopics,
  createTopics,
  findAllTopics,
  findTopicById,
  findTopicByIdAndDelete,
  findTopicBySlug,
} from "./topics.repository";
import { logger } from "@/utils/logger";
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

export async function getAllTopics(
  limit: number,
  page: number,
  searchQuery?: string,
) {
  const requestObj: any = {};
  if (searchQuery) requestObj.label = { $regex: searchQuery, $options: "i" };

  const [topics, countOfTopics] = await Promise.all([
    findAllTopics(requestObj, limit, page),
    countAllTopics(requestObj),
  ]);

  return {
    topics,
    total: countOfTopics,
    page,
    limit,
    totalPages: Math.ceil(countOfTopics / limit),
  };
}

export async function updateTopicsService(
  topicId: string,
  dto: UpdateTopicsDto,
) {
  const topic = await findTopicById(topicId);
  if (!topic) throw ApiError.notFound("No Topic matched the provided ID");

  const slug = dto.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  topic.label = dto.label;
  topic.slug = slug;
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
