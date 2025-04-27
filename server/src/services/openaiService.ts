import { OpenAI } from "openai";

export interface ParsedCommand {
  discount: string;
  product: string;
  startDate: string;
  endDate: string;
  discountType: "code" | "automatic"; 
  collection?: string;                
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function parseDiscountCommand(
  command: string
): Promise<ParsedCommand | null> {
  console.log("Sending command to OpenAI...");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a helpful assistant. Extract structured discount data from the user's message and return a JSON object with the following properties:
- discount (e.g. "25%")
- product (e.g. "jackets")
- startDate (in YYYY-MM-DD format)
- endDate (in YYYY-MM-DD format)
- discountType: either "code" or "automatic" depending on what the user says
- collection: if user specifies a collection or category like "hoodies" or "summer collection", include it

Return only the JSON object. Do not include any explanations or formatting.
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
    console.log("OpenAI response:", parsed);

    return parsed ? JSON.parse(parsed) : null;
  } catch (err: any) {
    console.error("Error while calling OpenAI:", err.message || err);
    return null;
  }
}
