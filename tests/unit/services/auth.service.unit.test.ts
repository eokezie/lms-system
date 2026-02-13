/**
 * Pure unit tests — no database at all.
 * We mock the repository functions directly, so these run instantly.
 */
import * as authService from '@/modules/auth/auth.service';
import * as userRepository from '@/modules/users/user.repository';
import { ApiError } from '@/utils/apiError';
import { eventBus } from '@/events/eventBus';

jest.mock('@/modules/users/user.repository');
jest.mock('@/queues/email.queue', () => ({ emailQueue: { add: jest.fn() } }));

const mockedRepo = userRepository as jest.Mocked<typeof userRepository>;

describe('authService (unit — mocked repository)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register()', () => {
    it('throws 409 when user already exists', async () => {
      mockedRepo.userExists.mockResolvedValue(true);

      await expect(
        authService.register({
          firstName: 'Barry',
          lastName: 'Test',
          email: 'taken@test.com',
          password: 'Password123',
        }),
      ).rejects.toThrow(new ApiError(409, 'An account with this email already exists'));

      expect(mockedRepo.createUser).not.toHaveBeenCalled();
    });

    it('emits user.registered event on success', async () => {
      mockedRepo.userExists.mockResolvedValue(false);
      mockedRepo.createUser.mockResolvedValue({
        _id: { toString: () => 'user123' },
        email: 'barry@test.com',
        role: 'student',
        refreshTokens: [],
      } as any);
      mockedRepo.addRefreshToken.mockResolvedValue(null);
      mockedRepo.pruneRefreshTokens.mockResolvedValue(null);

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
      mockedRepo.findUserByEmailWithPassword.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@test.com', password: 'Password123' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });

    it('throws 401 when password does not match', async () => {
      mockedRepo.findUserByEmailWithPassword.mockResolvedValue({
        comparePassword: jest.fn().mockResolvedValue(false),
        _id: { toString: () => 'user123' },
        email: 'barry@test.com',
        role: 'student',
      } as any);

      await expect(
        authService.login({ email: 'barry@test.com', password: 'Wrong' }),
      ).rejects.toThrow(new ApiError(401, 'Invalid email or password'));
    });
  });
});
