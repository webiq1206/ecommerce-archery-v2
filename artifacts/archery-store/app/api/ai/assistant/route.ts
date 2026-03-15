import { NextRequest } from "next/server";
import { db, productsTable, categoriesTable, brandsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";

const SYSTEM_PROMPT = `You are the Apex Archery shopping advisor. You help customers find the right archery gear based on their experience level, intended use (hunting, target, 3D), budget, and preferences.

Key knowledge:
- Compound bows: Best for hunting and target. Key specs: draw weight, draw length, axle-to-axle, IBO speed, let-off %
- Recurve bows: Traditional archery, Olympic-style. Key specs: draw weight at draw length, AMO length
- Crossbows: Hunting focused. Key specs: draw weight, power stroke, bolt speed
- Arrow selection depends on bow type, draw weight, and intended use (spine matching)
- Broadheads: Fixed blade for reliability, mechanical for larger cutting diameter
- Essential accessories: sight, rest, release, stabilizer, quiver

When recommending products, include them in a special format:
<PRODUCT_RECOMMENDATIONS>[{"id":"product-id","name":"Product Name","slug":"product-slug","price":299.99,"image":"/images/product-bow-1.png","reason":"Brief reason for recommending"}]</PRODUCT_RECOMMENDATIONS>

Be knowledgeable, friendly, and concise. Ask clarifying questions when needed.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Fetch some products for context
  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      price: productsTable.price,
      shortDescription: productsTable.shortDescription,
    })
    .from(productsTable)
    .where(eq(productsTable.status, "ACTIVE"))
    .orderBy(desc(productsTable.createdAt))
    .limit(20);

  const productContext = products.length > 0
    ? `\n\nAvailable products (use these for recommendations):\n${products.map((p) => `- ${p.name} ($${p.price}, slug: ${p.slug}, id: ${p.id}): ${p.shortDescription ?? ""}`).join("\n")}`
    : "";

  const fullSystemPrompt = SYSTEM_PROMPT + productContext;

  // If no AI API key configured, return a mock streaming response
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    const mockResponse = getMockResponse(messages[messages.length - 1]?.content ?? "");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = mockResponse.split(" ");
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((r) => setTimeout(r, 30));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // OpenAI streaming
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {}
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response("AI not configured", { status: 500 });
}

function getMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("new") || lower.includes("beginner") || lower.includes("start")) {
    return "Great question! For a beginner, I'd recommend starting with a compound bow package. These come with everything you need - bow, sight, rest, and quiver. Look for a draw weight range of 10-70 lbs so you can start light and work your way up as you build strength. A draw length range of 19-30\" will give you room to grow. What's your budget range? I can narrow down the best options for you.";
  }
  if (lower.includes("hunt") || lower.includes("deer")) {
    return "For deer hunting, you'll want a compound bow with at least 40 lbs of draw weight (most states require 40-45 lbs minimum). Look for an IBO speed of 300+ FPS for good kinetic energy. A shorter axle-to-axle length (30-33\") is better for maneuverability in a tree stand or blind. Pair it with fixed blade broadheads for maximum penetration. What's your experience level and budget?";
  }
  if (lower.includes("3d") || lower.includes("target")) {
    return "For 3D archery, stability and accuracy are key. Look for a longer axle-to-axle bow (34-36\") for better aiming stability. A brace height of 6\" or more gives you a more forgiving shot. You'll want a quality multi-pin or single-pin adjustable sight, and carbon arrows matched to your draw weight. Would you like me to suggest a complete competition setup?";
  }
  if (lower.includes("arrow")) {
    return "Choosing the right arrows is crucial! The most important factor is spine - the stiffness of the arrow shaft. This needs to match your bow's draw weight and your draw length. Carbon arrows are the most popular choice - they're lightweight, durable, and consistent. For hunting, you'll want a heavier arrow (8-10 GPI) for better penetration. For target shooting, lighter arrows (5-7 GPI) give you flatter trajectory. What bow are you shooting?";
  }
  return "I'd be happy to help you find the right gear! To give you the best recommendations, could you tell me:\n\n1. What type of archery are you interested in? (hunting, target, 3D, recreational)\n2. What's your experience level?\n3. Do you have a budget range in mind?\n\nWith these details, I can suggest the perfect setup for you.";
}
