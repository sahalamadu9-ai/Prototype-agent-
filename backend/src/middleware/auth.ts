import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { apiError } from '../utils/apiResponse.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json(apiError('MISSING_AUTH_TOKEN', 'Missing authentication token'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { sub: string; email?: string };
    req.userId = decoded.sub;
    req.user = { id: decoded.sub, email: decoded.email ?? null };
    return next();
  } catch (error) {
    return res.status(401).json(
      apiError('INVALID_TOKEN', 'Invalid token', {
        detail: error instanceof Error ? error.message : 'Token verification failed',
      }),
    );
  }
};
