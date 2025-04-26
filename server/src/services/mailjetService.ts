import Mailjet from 'node-mailjet';
import fs from 'fs';
import path from 'path';

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY!,
  process.env.MAILJET_SECRET_KEY!
);

const EMAILS_PATH = path.join(__dirname, '../data/emails.json');

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

export async function sendDiscountEmail(
  recipients: string[],
  subject: string,
  htmlContent: string
) {
  try {
    const messages = recipients.map(email => ({
      From: {
        Email: "fnirmal802@gmail.com",
        Name: "Discount Bot"
      },
      To: [
        {
          Email: email,
          Name: "Customer"
        }
      ],
      Subject: subject,
      HTMLPart: htmlContent
    }));

    const request = mailjet.post("send", { version: "v3.1" });

    const response = await request.request({
      Messages: messages
    });

    console.log("📨 Mailjet response:", response.body);

  } catch (error: any) {
    console.error("❌ Mailjet Email Error:", error.response?.body || error.message);
    throw new Error("Failed to send email via Mailjet");
  }
}
