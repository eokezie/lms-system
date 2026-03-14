export interface CreateRatingDto {
  rating: number;
  reviewText?: string;
}

export interface UpdateRatingDto {
  rating?: number;
  reviewText?: string;
}

export interface GetRatingsQuery {
  page?: number;
  limit?: number;
}
