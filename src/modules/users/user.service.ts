import { IUser } from './user.model';
import {
  findUserById,
  findUserByEmailWithPassword,
  updateUserById,
  clearAllRefreshTokens,
} from './user.repository';
import { UpdateUserDto } from './user.types';
import { ApiError } from '@/utils/apiError';

export async function getUserProfile(userId: string): Promise<IUser> {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function updateUserProfile(userId: string, dto: UpdateUserDto): Promise<IUser> {
  const user = await updateUserById(userId, dto);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw ApiError.notFound('User not found');

  const userWithPw = await findUserByEmailWithPassword(user.email);
  if (!userWithPw) throw ApiError.notFound('User not found');

  const isMatch = await userWithPw.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  userWithPw.passwordHash = newPassword; // pre-save hook re-hashes
  await userWithPw.save();

  // Invalidate all sessions on password change
  await clearAllRefreshTokens(userId);
}
