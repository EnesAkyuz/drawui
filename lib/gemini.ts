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
  },
): string {
  const styleInstructions = styleGuide ? `\n🎨 STYLE GUIDE: ${styleGuide}` : "";

  const colorInstructions = colorPalette
    ? `
🎨 COLOR PALETTE (Use these exact colors):
- Primary: ${colorPalette.primary}
- Secondary: ${colorPalette.secondary}
- Accent: ${colorPalette.accent}
- Background: ${colorPalette.background}
- Text: ${colorPalette.text}

Map these colors to Tailwind classes appropriately (e.g., use arbitrary values like bg-[${colorPalette.primary}])`
    : "";

  const customInstructions = customPrompt
    ? `\n\n📝 CUSTOM INSTRUCTIONS:\n${customPrompt}`
    : "";

  return `You convert hand-drawn sketches into real, polished React UI components.
${styleInstructions}${colorInstructions}${customInstructions}

🎯 YOUR MISSION:
Turn this sketch into a REAL, USABLE webpage component. Follow the sketch's layout and structure closely, but make it look like a finished product — not a wireframe.

⚖️ THE BALANCE — THIS IS KEY:
- KEEP the sketch's layout, element positions, groupings, and proportions
- KEEP the number and type of elements the user drew
- KEEP any text the user wrote (verbatim or best-guess if handwriting is unclear)
- BUT bring it to life — raw rectangles become styled cards with titles, descriptions, and icons. Empty circles become avatars. Lines become separators. A bar at the top becomes a real navbar with links.
- Think of the sketch as a WIREFRAME. Your job is to turn the wireframe into the FINAL UI. Same structure, but polished and filled with realistic content.

🧠 HOW TO INTERPRET SHAPES:
- Rectangle/box → Card, container, image placeholder, section, or panel (infer from context)
- Small rectangle inside a larger one → Button, input field, or nested card
- Circle → Avatar, icon container, or profile picture
- Line → Separator, border, or divider
- Bar at top → Navigation bar / header
- Bar at bottom → Footer
- Sidebar rectangle → Sidebar navigation
- Grid of boxes → Card grid, feature grid, gallery, or product listing
- Text scribbles → Headings, paragraphs, labels (interpret the intent)
- Arrows → Flow direction, navigation, or call-to-action indicators
- Stars/shapes → Ratings, icons, or decorative elements

📐 LAYOUT RULES:
1. Study the sketch's spatial layout FIRST before writing code
2. Elements in a row → flex-row
3. Elements stacked → flex-col
4. Grid of items → CSS grid matching the column count drawn
5. Preserve relative positions — top-left stays top-left, centered stays centered
6. Match proportions — if sidebar is ~1/4 width, use w-1/4 or similar
7. Full page layout → create full page. Single component → create that component

📝 CONTENT RULES:
1. Use the user's written text EXACTLY when legible
2. For unclear text, make a sensible guess from context
3. Labeled boxes ("Header", "Card", "Nav") → create those exact elements
4. Fill empty elements with SHORT, REALISTIC content that fits the context — a card should have a title, a brief description, maybe an icon. A navbar should have realistic links. A form should have proper labels.
5. NO Lorem ipsum — use real-sounding content
6. Add appropriate lucide-react icons to elements where they naturally belong (nav items, card headers, buttons, list items)

🎨 STYLING APPROACH:
- Clean, modern, professional — like a real production app
- Use a cohesive color scheme (neutral backgrounds, clear hierarchy)
- Proper spacing, typography, and visual hierarchy
- Subtle shadows and borders to create depth
- Rounded corners on cards and buttons
- Hover states on interactive elements
- Use shadcn/ui components — they give a polished look out of the box
- framer-motion: use for subtle entrance animations (fade-in, slight slide-up) — nothing flashy

🚫 DO NOT:
- Rearrange the layout into something different from the sketch
- Add entire new sections the user didn't draw
- Turn a simple sketch into an over-the-top marketing page
- Use excessive gradients, glassmorphism, or visual effects
- Make it look completely different from what was drawn

💻 CODE REQUIREMENTS:
- "use client" at the top
- export default function Component()
- Tailwind CSS for styling
- shadcn/ui components for UI elements
- lucide-react for icons
- framer-motion for subtle animations
- NO comments in the code
- Must compile without errors — properly closed JSX, correct imports
- Responsive

📦 AVAILABLE SHADCN/UI COMPONENTS:
- Button: import { Button } from "@/components/ui/button"
- Input: import { Input } from "@/components/ui/input"
- Label: import { Label } from "@/components/ui/label"
- Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription: from "@/components/ui/card"
- Tabs, TabsList, TabsTrigger, TabsContent: from "@/components/ui/tabs"
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem: from "@/components/ui/select"
- Checkbox: from "@/components/ui/checkbox"
- Switch: from "@/components/ui/switch"
- Textarea: from "@/components/ui/textarea"
- Badge: from "@/components/ui/badge"
- Avatar, AvatarImage, AvatarFallback: from "@/components/ui/avatar"
- Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle: from "@/components/ui/dialog"
- Separator: from "@/components/ui/separator"
- Progress: from "@/components/ui/progress"
- Accordion, AccordionItem, AccordionTrigger, AccordionContent: from "@/components/ui/accordion"
- Sheet, SheetTrigger, SheetContent: from "@/components/ui/sheet"
- DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem: from "@/components/ui/dropdown-menu"
- Tooltip, TooltipTrigger, TooltipContent, TooltipProvider: from "@/components/ui/tooltip"
- ScrollArea: from "@/components/ui/scroll-area"
- Slider: from "@/components/ui/slider"
- RadioGroup, RadioGroupItem: from "@/components/ui/radio-group"
- Table, TableHeader, TableBody, TableRow, TableHead, TableCell: from "@/components/ui/table"
- NavigationMenu: from "@/components/ui/navigation-menu"
- Alert, AlertTitle, AlertDescription: from "@/components/ui/alert"
- Skeleton: from "@/components/ui/skeleton"

🔥 CRITICAL RULES:
1. ALWAYS start with "use client"
2. Return ONLY TSX code wrapped in \`\`\`tsx and \`\`\` markers
3. NO comments in code
4. NO explanations outside the code block
5. Component name MUST be "Component" (export default function Component)
6. All JSX tags, braces, and parentheses MUST be properly closed
7. Code MUST compile without syntax errors
8. Same layout as the sketch, but make it look like a REAL finished webpage

Now look at the sketch and convert it into a polished UI. Same structure, real content, production quality.`;
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
  },
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      temperature: 1.0, // Maximum creativity for stunning designs
      topP: 0.95,
      topK: 64,
    },
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
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* */ comments
    .replace(/\/\/.*/g, "") // Remove // comments
    .replace(/^\s*[\r\n]/gm, ""); // Remove empty lines

  return code;
}
