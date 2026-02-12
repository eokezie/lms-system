import { faker } from '@faker-js/faker';
import { User, IUser, UserRole } from '@/modules/users/user.model';

interface UserOverrides {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
}

/**
 * Creates a user in the DB with realistic fake data.
 * Pass overrides for anything you need to control in a specific test.
 */
export async function createTestUser(overrides: UserOverrides = {}): Promise<IUser> {
  return User.create({
    firstName: overrides.firstName ?? faker.person.firstName(),
    lastName: overrides.lastName ?? faker.person.lastName(),
    email: overrides.email ?? faker.internet.email().toLowerCase(),
    passwordHash: overrides.password ?? 'Password123',
    role: overrides.role ?? 'student',
    isEmailVerified: overrides.isEmailVerified ?? true,
  });
}

export async function createTestInstructor(overrides: UserOverrides = {}): Promise<IUser> {
  return createTestUser({ ...overrides, role: 'instructor' });
}

export async function createTestAdmin(overrides: UserOverrides = {}): Promise<IUser> {
  return createTestUser({ ...overrides, role: 'admin' });
}
