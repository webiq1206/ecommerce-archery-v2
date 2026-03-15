import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL ?? "orders@apexarchery.com";
const STORE_NAME = "Apex Archery";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}

export async function sendEmail({ to, subject, react, replyTo }: SendEmailOptions) {
  if (!resend) {
    console.log(`[Email Stub] To: ${to}, Subject: ${subject}`);
    return { id: "stub", error: null };
  }

  const { data, error } = await resend.emails.send({
    from: `${STORE_NAME} <${FROM_EMAIL}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    react,
    replyTo,
  });

  if (error) {
    console.error("[Email Error]", error);
  }

  return { id: data?.id, error };
}
