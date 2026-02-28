import { resend } from "@/libs/resend";
import { env } from "@/config/env";

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};

const mailer_sender = `Infinix Tech Cloud <${env.RESEND_MAILER_SENDER}>`;

export const resendEmailFunc = async ({
  to,
  from = mailer_sender,
  subject,
  text,
  html,
}: Params) => {
  return await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    text,
    subject,
    html,
  });
};
