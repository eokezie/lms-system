import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { ApiError } from '@/utils/apiError';
import { UserRole } from '@/modules/users/user.model';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Extend Express Request so controllers get typed access to req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    next(err); // JWT errors are handled in error middleware
  }
}

/**
 * Restrict a route to specific roles.
 * Always use AFTER authenticate().
 *
 * Usage: router.delete('/courses/:id', authenticate, authorize('admin'), handler)
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
}
