import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";

export function getGeminiClient() {
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY is not set in environment variables",
    );
  }

  return new GoogleGenerativeAI(apiKey);
}

export function createWebsitePrompt(
  styleGuide?: string,
  customPrompt?: string,
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  }
): string {
  const styleInstructions = styleGuide ? `\n🎨 STYLE GUIDE: ${styleGuide}` : '';

  const colorInstructions = colorPalette ? `
🎨 COLOR PALETTE (Use these exact colors):
- Primary: ${colorPalette.primary}
- Secondary: ${colorPalette.secondary}
- Accent: ${colorPalette.accent}
- Background: ${colorPalette.background}
- Text: ${colorPalette.text}

Map these colors to Tailwind classes appropriately (e.g., use arbitrary values like bg-[${colorPalette.primary}])` : '';

  const customInstructions = customPrompt ? `\n\n📝 CUSTOM INSTRUCTIONS:\n${customPrompt}` : '';

  return `You are an expert web designer. Look at this sketch and create a COMPLETE, beautiful webpage that FAITHFULLY reproduces the layout.
${styleInstructions}${colorInstructions}${customInstructions}

🎨 YOUR MISSION:
Create a full React/JSX component that accurately recreates this sketch's layout and structure.

✨ DESIGN REQUIREMENTS:
- STAY TRUE to the sketch layout - don't add extra sections or rearrange things
- Match the number of elements in the sketch (if there are 3 boxes, make 3 boxes)
- Preserve the relative positions and sizes from the sketch
- Use Tailwind CSS for styling to make it look polished and modern
- Use real, compelling content (NO "Lorem ipsum"!)
- Add subtle gradients, shadows, and polish but keep the structure intact

💻 CODE REQUIREMENTS:
- Return a COMPLETE React functional component
- NO COMMENTS in the code (no // or /* */ comments anywhere)
- Use Tailwind CSS classes only (no custom CSS)
- Component should be self-contained and production-ready
- Make it responsive (mobile-first)

📐 INTERPRET THE SKETCH:
- Rectangles → Sections, cards, buttons, or containers (keep the same layout)
- Text → Headlines, CTAs, navigation, or descriptions (in the same positions)
- Grouped elements → Navigation bars, feature grids, or forms (preserve grouping)
- Match the vertical flow of the sketch (top to bottom)
- Match the horizontal arrangement (left, center, right alignment)

🎯 EXAMPLE OUTPUT (NO COMMENTS):

\`\`\`tsx
export default function GeneratedWebsite() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-6 py-20">
        <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Ship Products 10x Faster
        </h1>
        <p className="text-xl text-gray-300 text-center mt-6 max-w-2xl mx-auto">
          Build stunning websites with AI-powered tools that understand your vision
        </p>
        <div className="flex gap-4 justify-center mt-12">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all">
            Get Started Free →
          </button>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
\`\`\`

CRITICAL RULES:
- Return ONLY the TSX code wrapped in \`\`\`tsx and \`\`\` markers
- ABSOLUTELY NO COMMENTS in the code (no // or /* */)
- NO explanations, NO notes, NO markdown outside the code block
- Component name MUST be "GeneratedWebsite"
- STAY FAITHFUL to the sketch layout - don't invent new sections
- Make it beautiful but keep the structure from the sketch

Now, analyze the sketch and generate the code:`;
}

export async function generateWebsite(
  base64Image: string,
  styleGuide?: string,
  customPrompt?: string,
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  }
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      temperature: 0.8, // High creativity
      topP: 0.95,
      topK: 40,
    }
  });

  const prompt = createWebsitePrompt(styleGuide, customPrompt, colorPalette);

  const mimeType = base64Image.startsWith("data:image/jpeg")
    ? "image/jpeg"
    : "image/png";

  const imagePart = {
    inlineData: {
      data: base64Image.split(",")[1],
      mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const text = result.response.text();

  // Extract code from markdown code block
  const codeMatch = text.match(/```(?:tsx|typescript|jsx)?\s*([\s\S]*?)```/);

  if (!codeMatch) {
    console.error("No code block found in response:", text);
    throw new Error("Failed to extract code from Gemini response");
  }

  let code = codeMatch[1].trim();

  // Strip out all comments to prevent rendering issues
  code = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
    .replace(/\/\/.*/g, '') // Remove // comments
    .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines

  return code;
}

