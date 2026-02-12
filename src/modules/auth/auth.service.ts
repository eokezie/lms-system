import jwt from 'jsonwebtoken';
import { IUser } from '@/modules/users/user.model';
import { userRepository } from '@/modules/users/user.repository';
import { ApiError } from '@/utils/apiError';
import { eventBus } from '@/events/eventBus';
import { env } from '@/config/env';
import { JwtPayload } from '@/middleware/auth.middleware';
import { RegisterDto, LoginDto, AuthTokens } from './auth.types';

class AuthService {
  async register(dto: RegisterDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    const exists = await userRepository.exists({ email: dto.email.toLowerCase() });
    if (exists) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const user = await userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password, // repository passes this as passwordHash; pre-save hook hashes it
    });

    const tokens = this.generateTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);
    await userRepository.pruneRefreshTokens(user._id.toString());

    eventBus.emit('user.registered', { userId: user._id.toString(), email: user.email });

    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: IUser; tokens: AuthTokens }> {
    // Must use the variant that selects +passwordHash
    const user = await userRepository.findByEmailWithPassword(dto.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = this.generateTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);
    await userRepository.pruneRefreshTokens(user._id.toString());

    return { user, tokens };
  }

  async refreshTokens(incomingRefreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(incomingRefreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findByIdWithRefreshTokens(payload.userId);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    const tokenExists = user.refreshTokens.some((rt) => rt.token === incomingRefreshToken);
    if (!tokenExists) {
      // Token reuse detected — wipe all sessions as a security measure
      await userRepository.clearAllRefreshTokens(payload.userId);
      throw ApiError.unauthorized('Refresh token reuse detected. Please login again.');
    }

    // Rotate: remove the used token, issue a new pair
    await userRepository.removeRefreshToken(payload.userId, incomingRefreshToken);
    const tokens = this.generateTokens(user);
    await userRepository.addRefreshToken(payload.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await userRepository.removeRefreshToken(userId, refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await userRepository.clearAllRefreshTokens(userId);
  }

  private generateTokens(user: IUser): AuthTokens {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
