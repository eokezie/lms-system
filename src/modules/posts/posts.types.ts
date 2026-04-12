export interface CreatePostDto {
  title: string;
  topicId: string;
  authorId: string;
  authorRole: string;
}

export interface UpdatePostDto {
  title: string;
  topicId: string;
}

export interface PostPaginationOptions {
  page?: number;
  limit?: number;
  topicStatus?: string;
  search?: string;
  sort?: string;
}
