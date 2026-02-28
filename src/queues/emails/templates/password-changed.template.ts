import { wrapEmail } from "../layout";

export interface PasswordChangedTemplateData {
  firstName: string;
}

export function passwordChangedTemplate(
  data: PasswordChangedTemplateData,
): string {
  const content = `
    <p>Hi ${data.firstName},</p>
    <p>This is a confirmation that your Infinix Tech password has been successfully updated.</p>
    <p>If you made this change, no further action is required.</p>
    <p>If you didn't, please contact our support team immediately.</p>
    <p class="signature">Stay secure,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "Password updated" });
}
