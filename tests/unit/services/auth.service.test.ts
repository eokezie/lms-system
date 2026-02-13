import * as authService from '@/modules/auth/auth.service';
import * as userRepository from '@/modules/users/user.repository';
import { ApiError } from '@/utils/apiError';
import { eventBus } from '@/events/eventBus';
import { createTestUser } from '../../fixtures/user.factory';

jest.mock('@/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
}));

describe('authService (integration — real in-memory DB)', () => {
  describe('register()', () => {
    it('creates a user and returns tokens', async () => {
      const emitSpy = jest.spyOn(eventBus, 'emit');

      const result = await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'barry@test.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('barry@test.com');
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(emitSpy).toHaveBeenCalledWith('user.registered', {
        userId: result.user._id.toString(),
        email: 'barry@test.com',
      });
    });

    it('hashes the password — never stores plain text', async () => {
      await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'barry@test.com',
        password: 'Password123',
      });

      const userWithHash = await userRepository.findUserByEmailWithPassword('barry@test.com');
      expect(userWithHash!.passwordHash).not.toBe('Password123');
      expect(userWithHash!.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('throws 409 if email already exists', async () => {
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
    it('returns tokens for valid credentials', async () => {
      await createTestUser({ email: 'login@test.com', password: 'Password123' });

      const result = await authService.login({
        email: 'login@test.com',
        password: 'Password123',
      });

      expect(result.tokens.accessToken).toBeDefined();
    });

    it('throws 401 for wrong password', async () => {
      await createTestUser({ email: 'login@test.com', password: 'Password123' });

      await expect(
        authService.login({ email: 'login@test.com', password: 'WrongPassword1' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });

    it('throws 401 for non-existent email', async () => {
      await expect(
        authService.login({ email: 'nobody@test.com', password: 'Password123' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });
  });

  describe('refreshTokens()', () => {
    it('returns new tokens for a valid refresh token', async () => {
      const { tokens } = await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'refresh@test.com',
        password: 'Password123',
      });

      const newTokens = await authService.refreshTokens(tokens.refreshToken);

      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).not.toBe(tokens.refreshToken);
    });

    it('throws 401 on refresh token reuse after rotation', async () => {
      const { tokens } = await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'reuse@test.com',
        password: 'Password123',
      });

      await authService.refreshTokens(tokens.refreshToken);

      await expect(
        authService.refreshTokens(tokens.refreshToken),
      ).rejects.toThrow(ApiError);
    });
  });
});
