import { type NextRequest, NextResponse } from "next/server";
import { generateWebsite } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 },
      );
    }

    // Generate complete website code with Gemini
    const websiteCode = await generateWebsite(
      body.image,
      body.styleGuide,
      body.customPrompt,
      body.colorPalette
    );

    return NextResponse.json({ code: websiteCode });
  } catch (error) {
    console.error("Error generating website:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to generate website: ${errorMessage}` },
      { status: 500 },
    );
  }
}
