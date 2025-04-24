import { OpenAI } from "openai";

// Define your expected return structure
export interface ParsedCommand {
  discount: string;
  product: string;
  startDate: string;
  endDate: string;
  targetGroup: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseDiscountCommand(
  command: string
): Promise<ParsedCommand | null> {
  console.log("🧠 Sending command to OpenAI...");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106", // or "gpt-4-1106-preview" if you prefer
      response_format: { type: "json_object" }, // ✅ FIXED
      messages: [
        {
          role: "system",
          content: `
You are a helpful assistant. Extract structured discount data from the user's message and return a JSON object with the following properties:
- discount (e.g. "25%")
- product (e.g. "jackets")
- startDate (YYYY-MM-DD format)
- endDate (YYYY-MM-DD format)
- targetGroup (e.g. "newsletter subscribers")

Return only a JSON object with those fields.
        `,
        },
        {
          role: "user",
          content: command,
        },
      ],
      temperature: 0.2,
    });

    const parsed = response.choices[0].message?.content;
    console.log("📨 Raw OpenAI response:", parsed);

    return parsed ? JSON.parse(parsed) : null;
  } catch (err: any) {
    console.error("❌ Error while calling OpenAI:", err.message || err);
    return null;
  }
}
