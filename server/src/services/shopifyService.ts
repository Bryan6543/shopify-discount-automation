import axios from 'axios';

const SHOPIFY_API_TOKEN = process.env.SHOPIFY_API_TOKEN!;
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL!;

interface DiscountInput {
  title: string;
  discount: string;
  startDate: string;
  endDate: string;
  collection?: string | null; // optional
}

export async function fetchDiscounts(): Promise<any[]> {
  try {
    const response = await axios.get(
      `${SHOPIFY_STORE_URL}/admin/api/2023-10/price_rules.json`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
        },
      }
    );

    const priceRules = response.data.price_rules;

    const allDiscounts = await Promise.all(
      priceRules.map(async (rule: any) => {
        let code = null;

        try {
          const codeRes = await axios.get(
            `${SHOPIFY_STORE_URL}/admin/api/2023-10/price_rules/${rule.id}/discount_codes.json`,
            {
              headers: {
                'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
              },
            }
          );
          code = codeRes.data.discount_codes[0]?.code || null;
        } catch (_) {
          
        }

        return {
          discount: `${Math.abs(rule.value)}%`,
          product: rule.title.replace("Discount for ", ""),
          startDate: rule.starts_at,
          endDate: rule.ends_at,
          type: code ? 'code' : 'automatic',
          discount_code: code,
          collection: rule.entitled_collection_ids?.length ? rule.entitled_collection_ids[0] : null
        };
      })
    );

    return allDiscounts;
  } catch (error: any) {
    console.error("❌ Failed to fetch discounts:", error.response?.data || error.message);
    throw new Error("Could not fetch discounts");
  }
}



// Convert percent string to number
const parseDiscountValue = (value: string) =>
  parseFloat(value.replace('%', '')) || 0;

// 🔸 Shared helper to fetch collection ID from name
async function getCollectionIdByName(name: string): Promise<number | null> {
  try {
    const response = await axios.get(
      `${SHOPIFY_STORE_URL}/admin/api/2023-10/custom_collections.json`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
        },
      }
    );

    const collection = response.data.custom_collections.find(
      (col: any) => col.title.toLowerCase() === name.toLowerCase()
    );

    return collection?.id || null;
  } catch (error: any) {
    console.error("❌ Failed to fetch collections:", error.response?.data || error.message);
    return null;
  }
}

// For one-time-use discount codes
export async function createShopifyDiscountCode(data: DiscountInput) {
  const { title, discount, startDate, endDate, collection } = data;
  const discountValue = parseDiscountValue(discount);
  const collectionId = collection ? await getCollectionIdByName(collection) : null;

  const priceRulePayload: any = {
    price_rule: {
      title,
      target_type: "line_item",
      target_selection: collectionId ? "entitled" : "all",
      allocation_method: "across",
      value_type: "percentage",
      value: `-${discountValue}`,
      customer_selection: "all",
      starts_at: new Date(startDate).toISOString(),
      ends_at: new Date(endDate).toISOString(),
      usage_limit: 1,
      once_per_customer: true,
    },
  };

  if (collectionId) {
    priceRulePayload.price_rule.entitled_collection_ids = [collectionId];
  }

  const priceRuleRes = await axios.post(
    `${SHOPIFY_STORE_URL}/admin/api/2023-10/price_rules.json`,
    priceRulePayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
      }
    }
  );

  const priceRuleId = priceRuleRes.data.price_rule.id;
  const code = title.replace(/\s+/g, '-').toUpperCase();

  const discountCodeRes = await axios.post(
    `${SHOPIFY_STORE_URL}/admin/api/2023-10/price_rules/${priceRuleId}/discount_codes.json`,
    {
      discount_code: { code },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
      }
    }
  );

  return {
    type: "code",
    discount_code: discountCodeRes.data.discount_code.code,
    price_rule_id: priceRuleId,
  };
}

//For automatic discounts (multi-use, no code)
export async function createShopifyAutomaticDiscount(data: DiscountInput) {
  const { title, discount, startDate, endDate, collection } = data;
  const discountValue = parseDiscountValue(discount);
  const collectionId = collection ? await getCollectionIdByName(collection) : null;

  const priceRulePayload: any = {
    price_rule: {
      title,
      target_type: "line_item",
      target_selection: collectionId ? "entitled" : "all",
      allocation_method: "across",
      value_type: "percentage",
      value: `-${discountValue}`,
      customer_selection: "all",
      starts_at: new Date(startDate).toISOString(),
      ends_at: new Date(endDate).toISOString(),
      once_per_customer: false,
    },
  };

  if (collectionId) {
    priceRulePayload.price_rule.entitled_collection_ids = [collectionId];
  }

  const priceRuleRes = await axios.post(
    `${SHOPIFY_STORE_URL}/admin/api/2023-10/price_rules.json`,
    priceRulePayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
      }
    }
  );

  return {
    type: "automatic",
    message: "Automatic discount created",
    price_rule_id: priceRuleRes.data.price_rule.id,
  };
}

// Still useful for UI collection dropdowns if needed
export async function fetchCollections(): Promise<{ id: number; title: string;}[]> {
  try {
    const response = await axios.get(
      `${SHOPIFY_STORE_URL}/admin/api/2023-10/custom_collections.json?fields=id,title,products_count`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_API_TOKEN,
        },
      }
    );

    return response.data.custom_collections.map((collection: any) => ({
      id: collection.id,
      title: collection.title,
    }));
  } catch (error: any) {
    console.error("❌ Failed to fetch collections:", error.response?.data || error.message);
    throw new Error("Could not fetch collections");
  }
}

