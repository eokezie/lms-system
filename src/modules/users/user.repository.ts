import { FilterQuery } from 'mongoose';
import { User, IUser } from './user.model';
import { CreateUserDto, UpdateUserDto } from './user.types';

/**
 * UserRepository owns every database interaction for the User collection.
 * Services never call Mongoose directly — they go through here.
 *
 * Benefits:
 *  - One place to change a query
 *  - Easy to mock in unit tests (mock the repo, not Mongoose)
 *  - Service files stay clean — business logic only
 */
class UserRepository {
  findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  // passwordHash is excluded by default in the schema — use this when you need to compare
  findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  findByIdWithRefreshTokens(id: string): Promise<IUser | null> {
    return User.findById(id).select('+refreshTokens').exec();
  }

  async exists(filter: FilterQuery<IUser>): Promise<boolean> {
    const doc = await User.exists(filter);
    return !!doc;
  }

  create(data: CreateUserDto): Promise<IUser> {
    return User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash: data.password, // pre-save hook hashes this
      role: data.role ?? 'student',
    });
  }

  updateById(id: string, data: UpdateUserDto): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  }

  addRefreshToken(
    userId: string,
    token: string,
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      {
        $push: { refreshTokens: { token, createdAt: new Date() } },
      },
      { new: true },
    ).exec();
  }

  removeRefreshToken(userId: string, token: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { refreshTokens: { token } } },
      { new: true },
    ).exec();
  }

  clearAllRefreshTokens(userId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $set: { refreshTokens: [] } },
      { new: true },
    ).exec();
  }

  // Keep only the last N refresh tokens per user (prune old sessions)
  pruneRefreshTokens(userId: string, keepLast = 5): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      [
        {
          $set: {
            refreshTokens: {
              $slice: ['$refreshTokens', -keepLast],
            },
          },
        },
      ],
      { new: true },
    ).exec();
  }

  markEmailVerified(userId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $set: { isEmailVerified: true } },
      { new: true },
    ).exec();
  }

  updatePassword(userId: string, newPasswordHash: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $set: { passwordHash: newPasswordHash } },
      { new: true },
    ).exec();
  }
}

// Export as singleton — one instance shared across the app
export const userRepository = new UserRepository();
