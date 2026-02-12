/**
 * Pure unit tests — no database, no MongoDB memory server.
 * The repository is mocked entirely, so these tests run instantly.
 *
 * Use this pattern when you want to test business logic in isolation
 * (e.g. "does the service throw the right error when repo returns null?")
 *
 * Use the integration tests (auth.service.test.ts with real DB) when you
 * want to test the full flow including actual DB writes.
 */
import { authService } from '@/modules/auth/auth.service';
import { userRepository } from '@/modules/users/user.repository';
import { ApiError } from '@/utils/apiError';
import { eventBus } from '@/events/eventBus';

// Mock the entire repository module
jest.mock('@/modules/users/user.repository');
jest.mock('@/queues/email.queue', () => ({ emailQueue: { add: jest.fn() } }));

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('AuthService (unit — mocked repository)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('throws 409 when user already exists', async () => {
      mockUserRepository.exists.mockResolvedValue(true);

      await expect(
        authService.register({
          firstName: 'Barry',
          lastName: 'Test',
          email: 'taken@test.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(new ApiError(409, 'An account with this email already exists'));

      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('emits user.registered event on success', async () => {
      mockUserRepository.exists.mockResolvedValue(false);
      mockUserRepository.create.mockResolvedValue({
        _id: { toString: () => 'user123' },
        email: 'barry@test.com',
        role: 'student',
        refreshTokens: [],
      } as any);
      mockUserRepository.addRefreshToken.mockResolvedValue(null);
      mockUserRepository.pruneRefreshTokens.mockResolvedValue(null);

      const emitSpy = jest.spyOn(eventBus, 'emit');

      await authService.register({
        firstName: 'Barry',
        lastName: 'Test',
        email: 'barry@test.com',
        password: 'Password123',
      });

      expect(emitSpy).toHaveBeenCalledWith('user.registered', {
        userId: 'user123',
        email: 'barry@test.com',
      });
    });
  });

  describe('login()', () => {
    it('throws 401 when user not found', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@test.com', password: 'Password123' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });

    it('throws 401 when password does not match', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue({
        comparePassword: jest.fn().mockResolvedValue(false),
        _id: { toString: () => 'user123' },
        email: 'barry@test.com',
        role: 'student',
      } as any);

      await expect(
        authService.login({ email: 'barry@test.com', password: 'WrongPassword' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });
  });
});
