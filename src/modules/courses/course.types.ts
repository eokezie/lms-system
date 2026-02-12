import { CourseStatus } from './course.model';

export interface CreateCourseDto {
  title: string;
  description: string;
  category: string;
  tags?: string[];
  price?: number;
  isFree?: boolean;
}

export interface UpdateCourseDto {
  title?: string;
  description?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  price?: number;
  isFree?: boolean;
  status?: CourseStatus;
}

export interface CoursePaginationOptions {
  page?: number;
  limit?: number;
  category?: string;
  status?: CourseStatus;
  search?: string;
}
