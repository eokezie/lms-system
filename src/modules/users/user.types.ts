import { UserRole } from './user.model';

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
}

export interface UserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
