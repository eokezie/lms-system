const BRAND_NAME = "Infinix Tech";
const CURRENT_YEAR = new Date().getFullYear();
const FOOTER_ADDRESS = "100 Smith Street, Melbourne VIC 3000";

const BASE_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f1f5f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06); }
  .header { background: #ffffff; padding: 24px 24px; text-align: center; border-bottom: 1px solid #e2e8f0; }
  .header h1 { color: #0f172a; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
  .header .tagline { color: #64748b; font-size: 13px; margin-top: 4px; }
  .body { padding: 36px 32px; }
  .body p { color: #334155; line-height: 1.65; margin: 0 0 16px; font-size: 15px; }
  .body p:last-of-type { margin-bottom: 0; }
  .body strong { color: #0f172a; font-weight: 600; }
  .cta-wrap { margin: 28px 0; text-align: center; }
  .cta { display: inline-block; background: #0d9488; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; }
  .cta:hover { background: #0f766e; }
  .cta-secondary { background: #1e293b; color: #ffffff !important; }
  .cta-secondary:hover { background: #334155; }
  .cta-block { display: block; width: 100%; text-align: center; box-sizing: border-box; }
  .list { margin: 20px 0; padding: 0; list-style: none; }
  .list li { color: #334155; line-height: 1.6; margin-bottom: 10px; padding-left: 28px; position: relative; font-size: 15px; }
  .list li:before { content: attr(data-num); position: absolute; left: 0; font-weight: 600; color: #0d9488; }
  .list-no-num li:before { content: ''; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: #0d9488; }
  .list-no-num li { padding-left: 22px; }
  .footer { background: #f8fafc; padding: 20px 24px; text-align: center; color: #64748b; font-size: 12px; line-height: 1.6; border-top: 1px solid #e2e8f0; }
  .footer p { margin: 0 0 8px; }
  .footer p:last-child { margin-bottom: 0; }
  .footer a { color: #0d9488; text-decoration: none; }
  .footer .footer-address { margin-top: 8px; }
  .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
  .highlight-box { background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
  .meta { color: #64748b; font-size: 14px; }
  table.meta-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
  table.meta-table td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #334155; }
  table.meta-table td:first-child { color: #64748b; width: 40%; }
  table.meta-table tr:last-child td { border-bottom: none; }
  .signature { margin-top: 24px; }
  .signature p { margin-bottom: 4px; }
  .otp-boxes { display: flex; gap: 10px; justify-content: center; margin: 24px 0; flex-wrap: wrap; }
  .otp-box { width: 48px; height: 56px; border: 2px solid #e2e8f0; border-radius: 8px; background: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #0f172a; letter-spacing: 0; }
  .summary-box { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
  .summary-box .summary-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px; }
  .course-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 16px; }
  .course-card img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
  .course-card .course-card-img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; }
  .course-card-info { flex: 1; }
  .course-card-title { font-weight: 600; color: #0f172a; margin: 0 0 4px; font-size: 15px; }
  .course-card-meta { font-size: 13px; color: #64748b; margin: 0; }
  .summary-table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 12px 0; }
  .summary-table td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #334155; }
  .summary-table td:first-child { color: #64748b; }
  .summary-table td:last-child { text-align: right; }
  .summary-table tr.total-row td { font-weight: 600; color: #0f172a; border-bottom: none; padding-top: 12px; }
  .banner-image { width: 100%; max-width: 100%; height: auto; display: block; margin: 0 0 24px; border-radius: 0; vertical-align: top; }
`;

export interface WrapEmailOptions {
  title?: string;
  tagline?: string;
  /** Recipient email for footer disclaimer */
  recipientEmail?: string;
  /** Unsubscribe URL for footer */
  unsubscribeUrl?: string;
}

export function wrapEmail(
  bodyContent: string,
  options: WrapEmailOptions = {},
): string {
  const title = options.title || BRAND_NAME;
  const tagline = options.tagline || "";
  const recipientEmail = options.recipientEmail;
  const unsubscribeUrl = options.unsubscribeUrl || "#";

  const footerSentTo =
    recipientEmail != null
      ? `<p>This email was sent to ${recipientEmail}. If you'd rather not receive this kind of email, don't want any more emails from ${BRAND_NAME}? <a href="${unsubscribeUrl}">Unsubscribe</a>.</p>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BRAND_NAME}</h1>
      ${tagline ? `<div class="tagline">${tagline}</div>` : ""}
    </div>
    <div class="body">
      ${bodyContent}
    </div>
    <div class="footer">
      ${footerSentTo}
      <p class="footer-address">${FOOTER_ADDRESS}</p>
      <p>© ${CURRENT_YEAR} ${BRAND_NAME}</p>
    </div>
  </div>
</body>
</html>`;
}

/** Renders a 6-character code as individual digit boxes */
export function renderOtpBoxes(code: string): string {
  const digits = String(code).replace(/\D/g, "").slice(0, 6).split("");
  const boxes = digits.map((d) => `<span class="otp-box">${d}</span>`).join("");
  return `<div class="otp-boxes">${boxes}</div>`;
}
