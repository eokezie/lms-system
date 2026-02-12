import { Response } from 'express';

interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>({
  res,
  statusCode = 200,
  message = 'Success',
  data,
  meta,
}: ApiResponseOptions<T>) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
    ...(meta && { meta }),
  });
}

export function sendCreated<T>({ res, message = 'Created', data, meta }: Omit<ApiResponseOptions<T>, 'statusCode'>) {
  return sendSuccess({ res, statusCode: 201, message, data, meta });
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
