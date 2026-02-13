import request from 'supertest';
import app from '@/config/app';
import { createTestUser } from '../../fixtures/user.factory';

jest.mock('@/queues/email.queue', () => ({
  emailQueue: { add: jest.fn() },
}));

jest.mock('@/config/redis', () => ({
  redisConnection: {},
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
}));

describe('POST /api/v1/auth/register', () => {
  it('registers a user and returns 201 with tokens', async () => {
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
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 400 for invalid payload', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      password: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('returns 409 for duplicate email', async () => {
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

  it('logs in and returns tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@integration.com', password: 'Password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@integration.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });
});
