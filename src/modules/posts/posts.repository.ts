import { Posts } from "./posts.model";
import { CreatePostDto, UpdatePostDto } from "./posts.types";

export function createPost(dto: CreatePostDto) {
  const { authorId } = dto;

  return Posts.create({
    ...dto,
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
