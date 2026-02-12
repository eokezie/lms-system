import { IUser } from './user.model';
import { userRepository } from './user.repository';
import { UpdateUserDto } from './user.types';
import { ApiError } from '@/utils/apiError';

class UserService {
  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<IUser> {
    const user = await userRepository.updateById(userId, dto);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await userRepository.findByIdWithRefreshTokens(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Re-fetch with password to compare
    const userWithPw = await userRepository.findByEmailWithPassword(user.email);
    if (!userWithPw) throw ApiError.notFound('User not found');

    const isMatch = await userWithPw.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    // Hash the new password via a pre-save hook by saving via the model
    userWithPw.passwordHash = newPassword;
    await userWithPw.save();

    // Invalidate all sessions — force re-login on all devices
    await userRepository.clearAllRefreshTokens(userId);
  }
}

export const userService = new UserService();
