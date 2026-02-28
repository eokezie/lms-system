import { wrapEmail } from "../layout";

export interface InactivityTemplateData {
  firstName: string;
  dashboardLink: string;
  bannerImageUrl?: string;
}

export function inactivityTemplate(data: InactivityTemplateData): string {
  const banner = data.bannerImageUrl
    ? `<img src="${data.bannerImageUrl}" alt="" class="banner-image" />`
    : "";

  const content = `
    ${banner}
    <p>Hi ${data.firstName} 👋,</p>
    <p>We noticed you haven't logged in to Infinix Tech for a while, and we just wanted to check in.</p>
    <p>Your learning journey is still waiting for you, and all your progress is saved.</p>
    <div class="cta-wrap">
      <a href="${data.dashboardLink}" class="cta cta-secondary">Continue learning</a>
    </div>
    <p>Remember, consistent learning—even a little at a time—makes a big difference.</p>
    <p class="signature">We're rooting for you,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "We Miss You" });
}
