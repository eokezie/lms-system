import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiError } from '@/utils/apiError';
import { logger } from '@/utils/logger';
import { env } from '@/config/env';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: Record<string, string> | undefined;

  // Our own operational errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose validation error
  else if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message]),
    );
  }

  // Mongoose duplicate key (e.g. unique email)
  else if ((err as NodeJS.ErrnoException).name === 'MongoServerError' && (err as any).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as any).keyPattern ?? {})[0] ?? 'field';
    message = `${field} already exists`;
  }

  // Mongoose cast error (e.g. invalid ObjectId in URL)
  else if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  // JWT errors
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Token expired';
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token';
  }

  // Log unexpected server errors with full stack
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    // Only expose stack in development
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
