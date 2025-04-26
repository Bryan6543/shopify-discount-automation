import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs";
import path from "path";

import { parseDiscountCommand } from "./services/openaiService";
import {
  createShopifyDiscountCode,
  createShopifyAutomaticDiscount,
  fetchCollections,
  fetchDiscounts,
} from "./services/shopifyService";
import { sendDiscountEmail } from "./services/mailjetService";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const EMAILS_PATH = path.join(__dirname, "../data/emails.json");

app.get("/", (_req: Request, res: Response) => {
  res.send("👋 Hello from your TypeScript + Express backend!");
});

// Load all emails from JSON file
app.get("/api/emails", (_req, res) => {
  try {
    const data = fs.readFileSync(EMAILS_PATH, "utf-8");
    const json = JSON.parse(data);
    res.json({ success: true, emails: json.recipients || [] }); // ✅ FIXED
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to read email list." });
  }
});

// Add a new email
app.post("/api/emails", (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ success: false, error: "Email is required." });

  try {
    const file = fs.readFileSync(EMAILS_PATH, "utf-8");
    const data = JSON.parse(file);

    if (!Array.isArray(data.recipients)) {
      data.recipients = [];
    }

    if (!data.recipients.includes(email)) {
      data.recipients.push(email);
      fs.writeFileSync(EMAILS_PATH, JSON.stringify({ recipients: data.recipients }, null, 2));
    }

    res.json({ success: true, emails: data.recipients });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update email list." });
  }
});

// Delete an email
app.delete("/api/emails/:email", (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const file = fs.readFileSync(EMAILS_PATH, "utf-8");
    const data = JSON.parse(file);

    if (!Array.isArray(data.recipients)) {
      return res.status(500).json({ success: false, error: "Invalid email list format" });
    }

    const updated = data.recipients.filter((e: string) => e !== email);
    fs.writeFileSync(EMAILS_PATH, JSON.stringify({ recipients: updated }, null, 2));
    res.json({ success: true, emails: updated });
  } catch (err) {
    console.error("❌ Failed to delete email:", err);
    res.status(500).json({ success: false, error: "Failed to delete email" });
  }
});


// Parse command only (no creation)
app.post("/api/parse", async (req: Request, res: Response) => {
  const { command } = req.body;
  console.log("Parsing command only:", command);

  try {
    const parsed = await parseDiscountCommand(command);
    if (!parsed) {
      return res
        .status(400)
        .json({ success: false, error: "OpenAI failed to parse the command." });
    }
    res.json({ success: true, parsed });
  } catch (err: any) {
    console.error("❌ Error parsing command:", err.message);
    res
      .status(500)
      .json({
        success: false,
        error: "Server error during parsing.",
        details: err.message,
      });
  }
});

// ✅ Get Shopify collections
app.get("/api/collections", async (_req: Request, res: Response) => {
  try {
    const collections = await fetchCollections();
    res.json({ success: true, collections });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: err.message || "Failed to fetch collections",
      });
  }
});

// Get created discounts
app.get("/api/discounts", async (_req: Request, res: Response) => {
  try {
    const discounts = await fetchDiscounts();
    res.json({ success: true, discounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});



// Create Shopify discount and send email to all saved emails
app.post("/api/command", async (req: Request, res: Response) => {
  const { command } = req.body;
  console.log("📩 Received command:", command);

  try {
    const parsed = await parseDiscountCommand(command);
    if (!parsed) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Failed to parse command. OpenAI returned null.",
        });
    }

    const title = `Discount for ${parsed.product}`;
    let shopifyResult;

    if (parsed.discountType === "automatic") {
      shopifyResult = await createShopifyAutomaticDiscount({
        title,
        discount: parsed.discount,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        collection: parsed.collection || null,
      });
    } else {
      shopifyResult = await createShopifyDiscountCode({
        title,
        discount: parsed.discount,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        collection: parsed.collection || null,
      });
    }

    // Email 
    const emailSubject = `${parsed.discount} OFF on ${parsed.product} – Limited Time Only!`;
    const emailBody = `
      <h2>🎉 New Discount Available!</h2>
      <p>We're offering <strong>${parsed.discount}</strong> off on <strong>${parsed.product}</strong>!</p>
      <p>🗓️ <strong>Valid From:</strong> ${parsed.startDate} <br>
         🗓️ <strong>To:</strong> ${parsed.endDate}</p>
      <p>💸 ${
        parsed.discountType === 'code' && 'discount_code' in shopifyResult
          ? `Use discount code: <strong>${shopifyResult.discount_code}</strong> at checkout!`
          : `This discount will be automatically applied at checkout.`
      }</p>
      ${
        parsed.collection
          ? `<p>🧺 Applies only to collection: <strong>${parsed.collection}</strong></p>`
          : ""
      }
      <br/>
      <p>Enjoy,</p>
      <p>Your Store Team</p>
    `;
    
 
    await sendDiscountEmail(emailSubject, emailBody);
    

    res.json({
      success: true,
      parsed,
      shopifyResult,
      email: "sent to multiple recipients",
    });
  } catch (err: any) {
    console.error("❌ Server-side error:", err.message || err);
    res.status(500).json({
      success: false,
      error: "Failed to process command",
      details: err.message || err,
    });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});


//Status Checking 

app.get("/api/status", async (_req: Request, res: Response) => {
  const statuses: { shopify: boolean; openai: boolean; mailjet: boolean } = {
    shopify: false,
    openai: false,
    mailjet: false,
  };

  // Shopify Status
  try {
    const response = await fetch(
      `${process.env.SHOPIFY_STORE_URL}/admin/api/2023-10/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_API_TOKEN!,
        },
      }
    );
    statuses.shopify = response.ok;
  } catch {}

  // Open Ai Status
  try {
    const openaiRes = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    statuses.openai = openaiRes.ok;
  } catch {}

  // Mailjet Status
  try {
    const mailjetTest = await fetch("https://api.mailjet.com/v3/REST/user", {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`
          ).toString("base64"),
      },
    });
    statuses.mailjet = mailjetTest.ok;
  } catch {}

  res.json({ success: true, statuses });
});
