import axios from 'axios';

const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN!;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL!;

export async function createShopifyDiscount(data: {
  title: string;
  discount: string;
  startDate: string;
  endDate: string;
}) {
  const { title, discount, startDate, endDate } = data;

  const discountValue = parseFloat(discount.replace('%', '')) || 0;

  // 1. Create the price rule
  const priceRulePayload = {
    price_rule: {
      title,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: "percentage",
      value: `-${discountValue}`, // Shopify expects a negative number
      customer_selection: "all",
      starts_at: new Date(startDate).toISOString(),
      ends_at: new Date(endDate).toISOString(),
      usage_limit: 100,
      once_per_customer: true
    }
  };

  try {
    const priceRuleResponse = await axios.post(
      `${SHOPIFY_STORE_URL}/admin/api/2023-10/price_rules.json`,
      priceRulePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
        }
      }
    );

    const priceRuleId = priceRuleResponse.data.price_rule.id;

    // 2. Create the discount code linked to that rule
    const discountCodePayload = {
      discount_code: {
        code: title.replace(/\s+/g, '-').toUpperCase() // e.g., DISCOUNT-FOR-HOODIES
      }
    };

    const discountCodeResponse = await axios.post(
      `${SHOPIFY_STORE_URL}/admin/api/2023-10/price_rules/${priceRuleId}/discount_codes.json`,
      discountCodePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
        }
      }
    );

    return {
      discount_code: discountCodeResponse.data.discount_code.code,
      price_rule_id: priceRuleId
    };

  } catch (error: any) {
    console.error("❌ Shopify Discount Error:", error.response?.data || error.message);
    throw new Error(JSON.stringify(error.response?.data || error.message));
  }
}
