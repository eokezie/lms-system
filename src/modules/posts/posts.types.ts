export interface CreatePostDto {
  title: string;
  topic: string;
  authorId: string;
  authorRole: string;
}

export interface UpdatePostDto {
  title: string;
  topic: string;
}
