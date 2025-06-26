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
- Top stores: ${topVendors}
- Products purchased: ${productCount}
- Total spent: $${moneySpent}
- Total saved: $${moneySaved}${topProductsText}

The persona should be a catchy 2-4 word phrase that captures this shopper's style (like "Midnight Luxury Explorer" or "Thrifty Tech Enthusiast"). 
Also include a short, one-sentence description explaining the persona.

Format the response exactly like this:
{
  "persona": "The persona name",
  "description": "A short, one-sentence description"
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        'You are a shopper‐persona generator. Given a list of product titles, output exactly 3–5 vivid, comma-separated persona labels—no explanations or extra text. Use diverse, creative terms drawn from a broad vocabulary. Example: Products: ["roses", "Valentine’s chocolates", "greeting card"] Labels: romantic admirer, heartfelt gift-giver, sentiment seeker',
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.8,
            max_tokens: 150,
        });

        // Parse the response to get the persona and description
        const content = response.choices[0].message.content;

        if (!content) {
            return {
                persona: "Mystery Shopper",
                description: "Your shopping style is a well-kept secret!",
            };
        }

        try {
            // Try to parse the JSON response
            return JSON.parse(content);
        } catch (e) {
            // If parsing fails, try to extract persona and description from text
            const personaMatch = content.match(
                /["']persona["']\s*:\s*["'](.+?)["']/
            );
            const descriptionMatch = content.match(
                /["']description["']\s*:\s*["'](.+?)["']/
            );

            return {
                persona: personaMatch ? personaMatch[1] : "Style Explorer",
                description: descriptionMatch
                    ? descriptionMatch[1]
                    : "You have a unique approach to shopping!",
            };
        }
    } catch (error) {
        console.error("Error generating shopping persona:", error);

        // Provide a fallback persona if the API call fails
        return {
            persona: "Resilient Shopper",
            description:
                "You overcome obstacles to find exactly what you need.",
        };
    }
}
