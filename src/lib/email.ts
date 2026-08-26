import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, text: string) => {
  // We expect SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to be provided.
  // As a fallback for development if not provided, we log it to prevent crashing.
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`\n=== [DEV MODE] Simulated Email to ${to} ===\nSubject: ${subject}\n\n${text}\n===========================================\n`);
    }
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"CalmHire" <noreply@calmhire.com>',
    to,
    subject,
    text,
  });
};
