import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';

import { parseDiscountCommand } from './services/openaiService';
import { createShopifyDiscount } from './services/shopifyService';
import { sendDiscountEmail } from './services/mailjetService';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.send("👋 Hello from your TypeScript + Express backend!");
});

app.post('/api/command', async (req: Request, res: Response) => {
  const { command } = req.body;
  console.log("📩 Received command:", command);

  try {
    const parsed = await parseDiscountCommand(command);
    console.log("📨 Raw Parsed Command:", parsed);

    // ✅ Guard: Stop if OpenAI returned nothing
    if (!parsed) {
      return res.status(400).json({
        success: false,
        error: "Failed to parse command. OpenAI returned null.",
      });
    }

    const title = `Discount for ${parsed.product}`;
    const shopifyResult = await createShopifyDiscount({
      title,
      discount: parsed.discount,
      startDate: parsed.startDate,
      endDate: parsed.endDate
    });

    const emailTo = 'fnirmal68@gmail.com'; // ✅ Change if needed
    const emailSubject = `${parsed.discount} OFF on ${parsed.product} – Limited Time Only!`;
    const emailBody = `
      <h2>🎉 New Discount Available!</h2>
      <p>We're offering <strong>${parsed.discount}</strong> off on <strong>${parsed.product}</strong>!</p>
      <p>🗓️ <strong>Valid From:</strong> ${parsed.startDate} <br>
         🗓️ <strong>To:</strong> ${parsed.endDate}</p>
      <p>💸 Use discount code: <strong>${shopifyResult.discount_code}</strong> at checkout!</p>
      <br/>
      <p>Enjoy,</p>
      <p>Your Store Team</p>
    `;

    await sendDiscountEmail(emailTo, emailSubject, emailBody);

    res.json({
      success: true,
      parsed,
      shopifyResult,
      email: "sent"
    });

  } catch (err: any) {
    console.error("❌ Server-side error:", err.message || err);
    res.status(500).json({
      success: false,
      error: "Failed to process command",
      details: err.message || err
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("Using token:", process.env.SHOPIFY_API_TOKEN);
});
