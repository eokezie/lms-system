import { authService } from '@/modules/auth/auth.service';
import { userRepository } from '@/modules/users/user.repository';
import { ApiError } from '@/utils/apiError';
import { eventBus } from '@/events/eventBus';
import { createTestUser } from '../../fixtures/user.factory';

// Mock the email queue so tests don't need Redis
jest.mock('@/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
}));

describe('AuthService', () => {
  describe('register()', () => {
    it('should create a new user and return tokens', async () => {
      const emitSpy = jest.spyOn(eventBus, 'emit');

      const result = await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'barry@test.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('barry@test.com');
      expect(result.user.firstName).toBe('Barry');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();

      // Verify domain event was fired
      expect(emitSpy).toHaveBeenCalledWith('user.registered', {
        userId: result.user._id.toString(),
        email: 'barry@test.com',
      });
    });

    it('should hash the password — never store plain text', async () => {
      await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'barry@test.com',
        password: 'Password123',
      });

      // Use the repo method that explicitly selects +passwordHash
      const userWithHash = await userRepository.findByEmailWithPassword('barry@test.com');
      expect(userWithHash!.passwordHash).not.toBe('Password123');
      expect(userWithHash!.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
    });

    it('should throw 409 if email already exists', async () => {
      await createTestUser({ email: 'existing@test.com' });

      await expect(
        authService.register({
          firstName: 'Barry',
          lastName: 'Test',
          email: 'existing@test.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(new ApiError(409, 'An account with this email already exists'));
    });
  });

  describe('login()', () => {
    it('should return tokens for valid credentials', async () => {
      await createTestUser({ email: 'login@test.com', password: 'Password123' });

      const result = await authService.login({
        email: 'login@test.com',
        password: 'Password123',
      });

      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should throw 401 for wrong password', async () => {
      await createTestUser({ email: 'login@test.com', password: 'Password123' });

      await expect(
        authService.login({ email: 'login@test.com', password: 'WrongPassword1' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });

    it('should throw 401 for non-existent email', async () => {
      await expect(
        authService.login({ email: 'nobody@test.com', password: 'Password123' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });
  });

  describe('refreshTokens()', () => {
    it('should return new tokens for a valid refresh token', async () => {
      const { tokens } = await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'refresh@test.com',
        password: 'Password123',
      });

      const newTokens = await authService.refreshTokens(tokens.refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      // Should be a new token, not the same one
      expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);
    });

    it('should throw 401 if refresh token is reused after rotation', async () => {
      const { tokens } = await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'reuse@test.com',
        password: 'Password123',
      });

      await authService.refreshTokens(tokens.refreshToken);

      // Attempt to reuse the original token after rotation
      await expect(
        authService.refreshTokens(tokens.refreshToken),
      ).rejects.toThrow(ApiError);
    });
  });
});
