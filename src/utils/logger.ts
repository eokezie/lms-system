import pino from 'pino';
import { env } from '@/config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  // In production: raw JSON, one line per entry — ship directly to Datadog/Loki/CloudWatch
  // In dev: pino-pretty makes it human-readable in the terminal
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  // Silence all output during tests
  ...(env.NODE_ENV === 'test' && { level: 'silent' }),
  // Redact sensitive fields from logs automatically
  redact: {
    paths: ['req.headers.authorization', 'body.password', 'body.passwordHash'],
    censor: '[REDACTED]',
  },
  base: {
    env: env.NODE_ENV,
  },
});
