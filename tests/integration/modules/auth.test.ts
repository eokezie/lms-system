import request from 'supertest';
import app from '@/config/app';
import { createTestUser } from '../../fixtures/user.factory';

// Mock queues — integration tests shouldn't need Redis
jest.mock('@/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
}));

jest.mock('@/config/redis', () => ({
  redisConnection: {},
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));

describe('POST /api/v1/auth/register', () => {
  it('should register a user and return 201 with tokens', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Barry',
      lastName: 'Tester',
      email: 'barry@integration.com',
      password: 'Password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('barry@integration.com');
    // Password should never appear in the response
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('should return 400 for invalid payload', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 409 for duplicate email', async () => {
    await createTestUser({ email: 'dupe@test.com' });

    const res = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Another',
      lastName: 'User',
      email: 'dupe@test.com',
      password: 'Password123',
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await createTestUser({ email: 'login@integration.com', password: 'Password123' });
  });

  it('should login and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@integration.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('should return 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@integration.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });
});
