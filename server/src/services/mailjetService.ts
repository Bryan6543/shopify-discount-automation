import Mailjet from 'node-mailjet';

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY!,
  process.env.MAILJET_SECRET_KEY!
);

export async function sendDiscountEmail(to: string, subject: string, htmlContent: string) {
  try {
    const request = mailjet.post("send", { version: "v3.1" });

    const response = await request.request({
      Messages: [
        {
          From: {
            Email: "fnirmal802@gmail.com", // ✅ Must be verified in Mailjet
            Name: "Discount Bot"
          },
          To: [
            {
              Email: to,
              Name: "Customer"
            }
          ],
          Subject: subject,
          HTMLPart: htmlContent
        }
      ]
    });

    const result = response.body as any; // 👈 Tell TypeScript to ignore the type error here
    console.log("📨 Email sent via Mailjet to:", result.Messages[0].To[0].Email);

  } catch (error: any) {
    console.error("❌ Mailjet Email Error:", error.response?.body || error.message);
    throw new Error("Failed to send email via Mailjet");
  }
}
