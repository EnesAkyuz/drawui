import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GeminiComponentResponse } from "@/types/canvas";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";

export function getGeminiClient() {
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY is not set in environment variables",
    );
  }

  return new GoogleGenerativeAI(apiKey);
}

export function createGeminiPrompt(availableComponents: string[]): string {
  return `Analyze this UI sketch and identify shadcn/ui components.

Available components: ${availableComponents.join(", ")}

Return ONLY valid JSON array format:
[
  {
    "type": "button" | "input" | "card" | ...,
    "position": { "x": number, "y": number, "width": number, "height": number },
    "props": {
      // component-specific props (e.g., variant, placeholder, className)
    }
  }
]

Rules:
- Detect common UI patterns (buttons, inputs, cards, labels, etc.)
- Estimate position and size based on drawing bounds
- Provide sensible default props
- If nothing recognizable, return empty array: []
- Return ONLY the JSON array, no additional text

Examples:
- Rectangle with text inside → button
- Long horizontal rectangle → input
- Rectangle with multiple sections → card
- Short text → label`;
}

export function validateGeminiResponse(
  response: any,
): response is GeminiComponentResponse[] {
  if (!Array.isArray(response)) {
    return false;
  }

  if (response.length === 0) {
    return true;
  }

  return response.every((item) => {
    return (
      typeof item.type === "string" &&
      item.position &&
      typeof item.position.x === "number" &&
      typeof item.position.y === "number" &&
      typeof item.position.width === "number" &&
      typeof item.position.height === "number" &&
      typeof item.props === "object"
    );
  });
}

export async function analyzeDrawing(
  base64Image: string,
  availableComponents: string[],
): Promise<GeminiComponentResponse[]> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = createGeminiPrompt(availableComponents);

  const imagePart = {
    inlineData: {
      data: base64Image.split(",")[1], // Remove data:image/png;base64, prefix
      mimeType: "image/png",
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);

  if (!jsonMatch) {
    console.warn("No JSON found in Gemini response:", text);
    return [];
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    if (!validateGeminiResponse(parsed)) {
      console.warn("Invalid Gemini response format:", parsed);
      return [];
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return [];
  }
}
