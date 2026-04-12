import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // MongoDB — external, just a URI
  MONGODB_URI: z.string().url("MONGODB_URI must be a valid connection string"),

  // Redis
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(500),

  // Mux
  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),
  MUX_SIGNING_SECRET: z.string().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

  BACKEND_BASE_URL: z.string().url().optional(),
  FRONTEND_OAUTH_REDIRECT_URI: z.string().url().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),
  RESEND_MAILER_SENDER: z.string().email().optional(),

  // Digital Ocean Spaces
  DIGITAL_OCEAN_SPACES_ACCESS_KEY_ID: z.string().optional(),
  DIGITAL_OCEAN_SPACES_SECRET_ACCESS_KEY: z.string().optional(),

  // Anthropic (Claude AI)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CURRENCY: z.string().default("ngn"),
  STRIPE_SUCCESS_URL: z.string().url().optional(),
  STRIPE_CANCEL_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌  Invalid environment variables:");
  parsed.error.errors.forEach((err) => {
    console.error(`${err.path.join(".")}: ${err.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
