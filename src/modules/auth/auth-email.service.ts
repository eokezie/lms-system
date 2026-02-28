import {
  otpEmailTemplate,
  welcomeEmailTemplate,
  forgotPasswordTemplate,
  passwordChangedTemplate,
} from "@/queues/emails/templates";
import { resendEmailFunc } from "@/libs/resend-mail-service";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";

function getFrontendBaseUrl(): string {
  const oauth = env.FRONTEND_OAUTH_REDIRECT_URI;
  if (oauth) {
    try {
      return new URL(oauth).origin;
    } catch {
      // ignore
    }
  }
  return "http://localhost:3000";
}

export async function sendWelcomeEmail(params: {
  email: string;
  firstName: string;
}): Promise<void> {
  const loginLink = `${getFrontendBaseUrl()}/login`;
  const html = welcomeEmailTemplate({
    firstName: params.firstName,
    loginLink,
  });
  const text = `Hi ${params.firstName}, welcome to Infinix Tech. Your account has been created. Log in here: ${loginLink}`;
  await resendEmailFunc({
    to: params.email,
    subject: "Welcome to Infinix Tech",
    html,
    text,
  });
  logger.info({ email: params.email }, "Welcome email sent via Resend");
}

export async function sendOtpEmail(params: {
  email: string;
  firstName: string;
  otp: string;
}): Promise<void> {
  const html = otpEmailTemplate(params.otp, params.firstName);
  const text = `Hi ${params.firstName}, your verification code is: ${params.otp}. It's valid for 10 minutes.`;
  await resendEmailFunc({
    to: params.email,
    subject: "Your verification code – Infinix Tech",
    html,
    text,
  });
  logger.info({ email: params.email }, "OTP email sent via Resend");
}

export async function sendForgotPasswordOtpEmail(params: {
  email: string;
  firstName: string;
  otp: string;
}): Promise<void> {
  const html = forgotPasswordTemplate({
    firstName: params.firstName,
    recoveryCode: params.otp,
  });
  const text = `Hi ${params.firstName}, your password reset code is: ${params.otp}. Use it to reset your password.`;
  await resendEmailFunc({
    to: params.email,
    subject: "Forgot Password – Infinix Tech",
    html,
    text,
  });
  logger.info(
    { email: params.email },
    "Forgot password OTP email sent via Resend",
  );
}

export async function sendForgotPasswordLinkEmail(params: {
  email: string;
  firstName: string;
  resetLink: string;
  timeLimit: string;
}): Promise<void> {
  const html = forgotPasswordTemplate({
    firstName: params.firstName,
    resetLink: params.resetLink,
    timeLimit: params.timeLimit,
  });
  const text = `Hi ${params.firstName}, reset your password here: ${params.resetLink}. This link expires in ${params.timeLimit}.`;
  await resendEmailFunc({
    to: params.email,
    subject: "Reset your password – Infinix Tech",
    html,
    text,
  });
  logger.info(
    { email: params.email },
    "Forgot password link email sent via Resend",
  );
}

export async function sendPasswordChangedEmail(params: {
  email: string;
  firstName: string;
}): Promise<void> {
  const html = passwordChangedTemplate({ firstName: params.firstName });
  const text = `Hi ${params.firstName}, your Infinix Tech password was successfully updated. If you didn't make this change, contact support.`;
  await resendEmailFunc({
    to: params.email,
    subject: "Your password was updated – Infinix Tech",
    html,
    text,
  });
  logger.info(
    { email: params.email },
    "Password changed email sent via Resend",
  );
}
