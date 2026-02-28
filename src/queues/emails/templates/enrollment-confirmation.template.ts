import { wrapEmail } from "../layout";

export interface EnrollmentConfirmationTemplateData {
  firstName: string;
  courseName: string;
  courseLink: string;
  courseImageUrl?: string;
  providerName?: string;
}

export function enrollmentConfirmationTemplate(
  data: EnrollmentConfirmationTemplateData,
): string {
  const cardImage = data.courseImageUrl
    ? `<img src="${data.courseImageUrl}" alt="" class="course-card-img" />`
    : "";
  const provider = data.providerName
    ? `<p class="course-card-meta">${data.providerName}</p>`
    : "";

  const content = `
    <p>Hi ${data.firstName} 👋,</p>
    <p>You've successfully enrolled in <strong>${data.courseName}</strong> on Infinix Tech. You can start learning immediately at your own pace.</p>
    <div class="course-card">
      ${cardImage}
      <div class="course-card-info">
        <p class="course-card-title">${data.courseName}</p>
        ${provider}
      </div>
    </div>
    <div class="cta-wrap">
      <a href="${data.courseLink}" class="cta">Go to course</a>
    </div>
    <p>We wish you an amazing learning experience.</p>
    <p class="signature">Cheers,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "Course Enrollment Confirmation" });
}
