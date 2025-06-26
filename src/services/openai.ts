import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    organization: import.meta.env.VITE_OPENAI_ORG_ID,
    dangerouslyAllowBrowser: true, // Needed for client-side usage
});

/**
 * Generates a shopping persona based on order history and preferences
 */
export async function generateShoppingPersona(userData: {
    topOrderedVendors: Array<{ vendor: string; orderCount: number }>;
    productsBought: number;
    moneySpent: number;
    totalSaved: number;
    topProducts?: Array<{ name: string; count: number }>;
}) {
    // Extract key information for the prompt
    const topVendors = userData.topOrderedVendors
        .slice(0, 3)
        .map((v) => v.vendor)
        .join(", ");

    const productCount = userData.productsBought;
    const moneySpent = userData.moneySpent;
    const moneySaved = userData.totalSaved;

    // Format top products for the prompt
    const topProductsText =
        userData.topProducts && userData.topProducts.length > 0
            ? `\n- Top purchased products: ${userData.topProducts
                  .slice(0, 5)
                  .map((p) => p.name)
                  .join(", ")}`
            : "";

    // Create a detailed prompt for better results
    const prompt = `Generate a creative, fun shopping persona name inspired by Spotify Wrapped playlists.

Shopping Details:
- Top stores: ${topVendors || "Various retailers"}
- Products purchased: ${productCount || "Several items"}
- Total spent: $${moneySpent || 500}
- Total saved: $${moneySaved || 100}${topProductsText}

The persona should be a catchy 2-4 word phrase that captures this shopper's style (like "Midnight Luxury Explorer" or "Thrifty Tech Enthusiast"). 
Also include a short, one-sentence description explaining the persona.

YOU MUST format the response EXACTLY like this JSON:
{
  "persona": "The persona name",
  "description": "A short, one-sentence description"
}`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    'You are a specialized shopping persona generator. Your sole purpose is to analyze shopping data and create fun, creative personas. Always return a valid JSON object with "persona" and "description" keys. The persona should be a catchy 2-4 word phrase, and the description should be one sentence explaining the persona.',
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.7, // Lower temperature for more predictable outputs
        max_tokens: 150,
        response_format: { type: "json_object" }, // Request JSON response format
    });
    // Debug: log the raw OpenAI response
    console.log("OpenAI raw response:", response);
    const content = response.choices[0].message.content;

    if (!content) {
        console.error("No content returned from OpenAI", response);
        throw new Error("No content returned from OpenAI");
    }

    let parsed;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        console.error("Failed to parse OpenAI response as JSON", content);
        throw new Error("Failed to parse OpenAI response as JSON");
    }
    if (!parsed.persona || !parsed.description) {
        console.error("OpenAI response missing required fields", parsed);
        throw new Error("OpenAI response missing required fields");
    }
    return parsed;
}
