import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '3000');
vi.stubEnv('JWT_SECRET', 'test-secret-key-12345');
vi.stubEnv('JWT_EXPIRES_IN', '7d');

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockCompare = vi.fn();
const mockHash = vi.fn();

vi.mock('../db/client.js', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
  },
}));

import { registerUser, loginUser } from '../api/auth/controller.js';
import { authMiddleware } from '../middleware/auth.js';

describe('auth middleware', () => {
  it('accepts valid bearer token and attaches userId', () => {
    const token = jwt.sign({ sub: 'user-123', email: 'user@example.com' }, 'test-secret-key-12345');
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(req.userId).toBe('user-123');
    expect(req.user.email).toBe('user@example.com');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects missing token', () => {
    const req: any = { headers: {} };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid bearer token', () => {
    const req: any = { headers: { authorization: 'Bearer invalid-token' } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });
});

describe('auth controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a user and returns a token', async () => {
    mockHash.mockResolvedValue('hashed-password');
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'user-1', email: 'test@example.com', name: 'Tester' });

    const req: any = {
      body: { email: 'test@example.com', password: 'supersecret', name: 'Tester' },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await registerUser(req, res);

    expect(mockHash).toHaveBeenCalledWith('supersecret', 10);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('rejects duplicate user registration', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-user', email: 'test@example.com' });

    const req: any = {
      body: { email: 'test@example.com', password: 'supersecret', name: 'Tester' },
    };
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('logs in a valid user', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      name: 'Tester',
    });
    mockCompare.mockResolvedValue(true);

    const req: any = { body: { email: 'test@example.com', password: 'supersecret' } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await loginUser(req, res);

    expect(mockCompare).toHaveBeenCalledWith('supersecret', 'hashed-password');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('rejects invalid login credentials', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      name: 'Tester',
    });
    mockCompare.mockResolvedValue(false);

    const req: any = { body: { email: 'test@example.com', password: 'wrong-pass' } };
    const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});
