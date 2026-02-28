import { wrapEmail, renderOtpBoxes } from "../layout";

export function otpEmailTemplate(otp: string, name: string): string {
  const content = `
    <p>Hi ${name} 👋,</p>
    <p>Thanks for signing up on Infinix Tech.</p>
    <p>To complete your registration, please verify your email with the recovery code below:</p>
    ${renderOtpBoxes(otp)}
    <p>This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
    <p>If you didn't create an account on Infinix Tech, you can safely ignore this email.</p>
    <p class="signature">See you inside,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "Confirm Email Address" });
}
