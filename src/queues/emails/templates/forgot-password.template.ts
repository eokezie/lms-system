import { wrapEmail, renderOtpBoxes } from "../layout";

export interface ForgotPasswordTemplateData {
  firstName: string;
  recoveryCode?: string;
  resetLink?: string;
  timeLimit?: string;
}

export function forgotPasswordTemplate(
  data: ForgotPasswordTemplateData,
): string {
  const useCode = data.recoveryCode != null && data.recoveryCode.length > 0;

  const codeBlock = useCode ? renderOtpBoxes(data.recoveryCode!) : "";
  const ctaBlock =
    !useCode && data.resetLink
      ? `<div class="cta-wrap"><a href="${data.resetLink}" class="cta">Reset Password</a></div><p class="meta">This link will expire in <strong>${data.timeLimit ?? "1 hour"}</strong> for security reasons.</p>`
      : "";

  const content = `
    <p>Hi ${data.firstName} 👋,</p>
    <p>We received a request to reset your Infinix Tech password. ${useCode ? "This is your recovery code:" : "Click the button below to create a new password:"}</p>
    ${codeBlock}
    ${ctaBlock}
    <p>If you didn't request to change the password for your account on Infinix Tech, you can safely ignore this email. Your account will remain safe.</p>
    <p class="signature">Stay Secure,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "Forgot Password" });
}
