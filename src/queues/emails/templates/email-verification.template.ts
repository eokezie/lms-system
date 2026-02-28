import { wrapEmail, renderOtpBoxes } from "../layout";

export interface EmailVerificationTemplateData {
  firstName: string;
  verificationCode?: string;
  verificationLink?: string;
}

export function emailVerificationTemplate(
  data: EmailVerificationTemplateData,
): string {
  const hasCode =
    data.verificationCode != null && data.verificationCode.length > 0;
  const codeBlock = hasCode ? renderOtpBoxes(data.verificationCode!) : "";

  const instruction = hasCode
    ? "To complete your registration, please verify your email with the recovery code below:"
    : "To complete your registration, please verify your email address by clicking the button below:";

  const ctaBlock =
    !hasCode && data.verificationLink
      ? `<div class="cta-wrap"><a href="${data.verificationLink}" class="cta">Verify Email</a></div>`
      : "";

  const content = `
    <p>Hi ${data.firstName} 👋,</p>
    <p>Thanks for signing up on Infinix Tech.</p>
    <p>${instruction}</p>
    ${codeBlock}
    <p>If you didn't create an account on Infinix Tech, you can safely ignore this email.</p>
    ${ctaBlock}
    <p class="signature">See you inside,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "Confirm Email Address" });
}
