import Mailjet from 'node-mailjet';
import fs from 'fs';
import path from 'path';

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY!,
  process.env.MAILJET_SECRET_KEY!
);

const EMAILS_PATH = path.join(__dirname, '../../data/emails.json');


interface EmailList {
  recipients: string[];
}

export function getEmailList(): string[] {
  try {
    const file = fs.readFileSync(EMAILS_PATH, 'utf8');
    const parsed: EmailList = JSON.parse(file);
    return parsed.recipients || [];
  } catch (err) {
    console.error("⚠️ Failed to load email list:", err);
    return [];
  }
}

export function saveEmailList(emails: string[]) {
  try {
    const payload: EmailList = { recipients: emails };
    fs.writeFileSync(EMAILS_PATH, JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save email list:", err);
  }
}

export async function sendDiscountEmail(subject: string, htmlContent: string) {
  const recipients = getEmailList();

  if (!recipients || recipients.length === 0) {
    console.warn("📭 No recipients found. Email not sent.");
    return;
  }

  try {
    const request = mailjet.post('send', { version: 'v3.1' });

    const response = await request.request({
      Messages: [
        {
          From: {
            Email: "fnirmal802@gmail.com", 
            Name: "Discount Bot"
          },
          To: recipients.map((email: string) => ({
            Email: email,
            Name: "Customer",
          })),
          Subject: subject,
          HTMLPart: htmlContent
        }
      ]
    });

    console.log("📨 Email sent via Mailjet to:", recipients.join(', '));
  } catch (error: any) {
    console.error("❌ Mailjet Email Error:", error.response?.body || error.message);
    throw new Error("Failed to send email via Mailjet");
  }
}

