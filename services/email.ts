import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Mail.Attachment[];
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter();
  const from = process.env.SMTP_FROM || 'no-reply@example.com';

  if (!transport) {
    console.log(`[email] SMTP not configured. Would send email to ${options.to} with subject: ${options.subject}`);
    return false;
  }

  try {
    await transport.sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    console.log(`[email] Successfully sent email to ${options.to}`);
    return true;
  } catch (error) {
    console.error(`[email] Failed to send email:`, error);
    return false;
  }
}

export async function sendPasswordReset(to: string, token: string, userId: string) {
  const base = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || '3333'}`;
  const resetUrl = `${base}/reset?token=${token}&uid=${userId}`;

  await sendEmail({
    to,
    subject: 'Password reset',
    html: `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

export async function sendExportEmail(
  to: string[],
  exportName: string,
  format: string,
  fileBuffer: Buffer,
  fileName: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #78BE20;">Scheduled Export Ready</h2>
      <p>Your scheduled export <strong>${exportName}</strong> has been generated.</p>
      <p><strong>Format:</strong> ${format.toUpperCase()}</p>
      <p><strong>File:</strong> ${fileName}</p>
      <p>The export file is attached to this email.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message from the Bright.Blue Brand Portal.
      </p>
    </div>
  `;

  const text = `
Scheduled Export Ready

Your scheduled export "${exportName}" has been generated.

Format: ${format.toUpperCase()}
File: ${fileName}

The export file is attached to this email.

---
This is an automated message from the Bright.Blue Brand Portal.
  `.trim();

  return sendEmail({
    to,
    subject: `[Bright.Blue Brand Portal] Scheduled Export: ${exportName}`,
    html,
    text,
    attachments: [
      {
        filename: fileName,
        content: fileBuffer,
      },
    ],
  });
}
