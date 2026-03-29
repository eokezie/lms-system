import { Request, Response, NextFunction } from "express";

const OBJECT_ID_24 = /^[a-fA-F0-9]{24}$/;

/**
 * Standalone `/api/v1/discussions` routes have no `/courses/:id` prefix, so clients
 * pass the course id as `?id=<courseObjectId>`. Copy it into `req.params.id` so the
 * same handlers and param validation as `/api/v1/courses/:id/discussions` work.
 */
export function attachCourseIdFromQuery(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.params.id && OBJECT_ID_24.test(String(req.params.id))) {
    next();
    return;
  }
  const q = req.query.id;
  if (typeof q === "string" && OBJECT_ID_24.test(q)) {
    req.params.id = q;
  }
  next();
}
