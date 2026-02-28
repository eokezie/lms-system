import { wrapEmail } from "../layout";

export interface PaymentConfirmationTemplateData {
  firstName: string;
  courseName: string;
  courseLink: string;
  amount: string;
  transactionId: string;
  paymentDate: string;
  originalPrice?: string;
  discount?: string;
  subtotal?: string;
  tax?: string;
  total?: string;
  receiptUrl?: string;
  courseImageUrl?: string;
  providerName?: string;
}

export function paymentConfirmationTemplate(
  data: PaymentConfirmationTemplateData,
): string {
  const useSummary =
    data.originalPrice != null ||
    data.discount != null ||
    data.subtotal != null ||
    data.tax != null ||
    data.total != null;

  const totalDisplay = data.total ?? data.amount;
  const subtotalDisplay = data.subtotal ?? data.amount;

  const courseRow =
    data.courseImageUrl != null
      ? `
    <div class="course-card" style="margin-bottom: 12px;">
      <img src="${data.courseImageUrl}" alt="" class="course-card-img" />
      <div class="course-card-info">
        <p class="course-card-title">${data.courseName}</p>
        ${data.providerName ? `<p class="course-card-meta">${data.providerName}</p>` : ""}
      </div>
    </div>`
      : useSummary
        ? `<p class="course-card-title" style="margin: 0 0 12px;">${data.courseName}</p>`
        : "";

  const summaryTable = useSummary
    ? `
    <table class="summary-table">
      ${data.originalPrice != null ? `<tr><td>Original price</td><td>${data.originalPrice}</td></tr>` : ""}
      ${data.discount != null ? `<tr><td>Discount</td><td>${data.discount}</td></tr>` : ""}
      <tr><td>Sub total</td><td>${subtotalDisplay}</td></tr>
      ${data.tax != null ? `<tr><td>Tax (5%)</td><td>${data.tax}</td></tr>` : ""}
      <tr class="total-row"><td>Total</td><td>${totalDisplay}</td></tr>
    </table>`
    : `
    <table class="meta-table">
      <tr><td>Course</td><td>${data.courseName}</td></tr>
      <tr><td>Amount</td><td>${data.amount}</td></tr>
      <tr><td>Transaction ID</td><td>${data.transactionId}</td></tr>
      <tr><td>Date</td><td>${data.paymentDate}</td></tr>
    </table>`;

  const summaryBlock = useSummary
    ? `
    <div class="summary-box">
      <p class="summary-title">Summary</p>
      ${courseRow}
      ${summaryTable}
      ${data.receiptUrl ? `<div class="cta-wrap" style="margin-top: 16px;"><a href="${data.receiptUrl}" class="cta cta-secondary cta-block">Download receipt</a></div>` : ""}
    </div>`
    : `
    <p><strong>Payment details:</strong></p>
    ${summaryTable}
    ${data.receiptUrl ? `<div class="cta-wrap"><a href="${data.receiptUrl}" class="cta cta-secondary">Download receipt</a></div>` : ""}
  `;

  const content = `
    <p>Hi ${data.firstName} 👋,</p>
    <p>Your payment on Infinix Tech has been successfully processed. Payment details:</p>
    ${summaryBlock}
    <p>If you have any issues or questions regarding your payment, please contact our support team.</p>
    <p class="signature">Thank you for choosing Infinix Tech,<br/><strong>The Infinix Tech Team</strong></p>
  `;
  return wrapEmail(content, { title: "Payment Confirmation" });
}
