import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'params' | 'query';

/**
 * Validates req[target] against a Zod schema.
 * Replaces the target with the parsed (type-safe, coerced) value on success.
 *
 * Usage:
 *   router.post('/login', validate(loginSchema), authController.login)
 *   router.get('/:id', validate(idParamSchema, 'params'), courseController.getById)
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace with parsed value so downstream code gets coerced types
    (req as any)[target] = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string> {
  return error.errors.reduce(
    (acc, issue) => {
      const path = issue.path.join('.') || 'value';
      acc[path] = issue.message;
      return acc;
    },
    {} as Record<string, string>,
  );
}
