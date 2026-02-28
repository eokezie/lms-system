import { wrapEmail } from "../layout";

export interface WelcomeTemplateData {
  firstName: string;
  loginLink: string;
}

export function welcomeEmailTemplate(data: WelcomeTemplateData): string {
  const content = `
    <p>Hi ${data.firstName} 👋,</p>
    <p>Welcome to Infinix Tech. You have successfully created an account and now have access to our self-paced learning resources.</p>
    <p><strong>What you can do next:</strong></p>
    <ol class="list">
      <li data-num="1.">Log in to your dashboard</li>
      <li data-num="2.">Enroll in available courses</li>
      <li data-num="3.">Track your learning progress</li>
    </ol>
    <div class="cta-wrap">
      <a href="${data.loginLink}" class="cta">Log in to dashboard</a>
    </div>
    <p>If you have any questions or need support, feel free to reach out to us.</p>
    <p class="signature">Happy learning,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "Welcome to Infinix Tech" });
}
