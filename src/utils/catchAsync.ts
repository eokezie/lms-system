import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async controller function so any rejected promise
 * is forwarded to Express's error middleware automatically.
 *
 * Instead of:
 *   async (req, res, next) => { try { ... } catch(e) { next(e) } }
 *
 * You write:
 *   catchAsync(async (req, res) => { ... })
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
