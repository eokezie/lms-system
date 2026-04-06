import { ITopics, Topics } from "./topics.model";
import { CreateTopicsDto } from "./topics.types";

export function createTopics(dto: CreateTopicsDto): Promise<ITopics> {
  return Topics.create(dto);
}

export function findAllTopics() {
  return Topics.find().lean();
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
