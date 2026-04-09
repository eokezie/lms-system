import { ITopics, Topics } from "./topics.model";
import { CreateTopicsDto } from "./topics.types";

export function createTopics(dto: CreateTopicsDto): Promise<ITopics> {
  return Topics.create(dto);
}

export function findAllTopics(
  requestObj: { label?: string },
  limit: number,
  page: number,
) {
  const skip = (page - 1) * limit;
  return Topics.find(requestObj)
    .lean()
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
}

export function countAllTopics(requestObj: { label?: string }) {
  return Topics.countDocuments(requestObj);
}

export function findTopicBySlug(slug: string) {
  return Topics.findOne({ slug }).exec();
}

export function findTopicById(topicId: string) {
  return Topics.findById(topicId).exec();
}

export function findTopicByIdAndDelete(topicId: string) {
  return Topics.findByIdAndDelete(topicId).exec();
}

export function increasePostCountOfTopic(topicId: string) {
  return Topics.updateOne({ _id: topicId }, { $inc: { postCount: 1 } });
}
